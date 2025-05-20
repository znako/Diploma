import base64
import json
import os
import time
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from io import BytesIO

import pandas as pd
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from helpers import (convert_to_json, generate_excel_from_conditions,
                     validate_data)
from model import create_model, solve_model
from sqlalchemy import (JSON, Boolean, Column, DateTime, Integer, String, Text,
                        create_engine)
from sqlalchemy.orm import declarative_base, sessionmaker

app = Flask(__name__)
CORS(app)

# Настройка подключения к PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Определение модели для хранения задач в БД
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True) # id записи
    task_id = Column(String, unique=True, index=True, nullable=False) # id задачи
    conditions = Column(JSON, nullable=False)  # исходные условия задачи (JSON)
    solution = Column(JSON)  # решение задачи (JSON), может быть пустым, если задача не решена
    solver = Column(String)  # решатель, который выбрал пользователь
    conditions_excel = Column(Text)  # поле для хранения сгенерированного Excel файла в виде base64 строки
    upload_time = Column(DateTime, default=datetime.now)  # время загрузки задачи
    solve_time = Column(DateTime)  # время завершения решения задачи
    canceled = Column(Boolean, default=False)  # отмена решения задачи пользователем
    
# Создание таблицы, если она еще не создана
Base.metadata.create_all(bind=engine)

@app.errorhandler(Exception)
def handle_exception(e):
    # Логируем полные трассировки исключений для отладки
    print("An error occurred:", traceback.format_exc())

    # Возвращаем ответ с корректными заголовками CORS
    response = jsonify({'error': str(e)})
    response.status_code = 500
    return response

# Эндпоит загрузки задачи через инпуты
@app.route('/task', methods=['POST'])
def solve_milp_route():
    data = request.json
    solver = data["solver"]
    data.pop('solver', None)
    try:
        model = create_model(data)
    except Exception as e:
        return handle_exception(e)

    task_id = str(uuid.uuid4())
    conditions_excel = generate_excel_from_conditions(data)
    db = SessionLocal()
    # Создаем запись в БД (upload_time установится автоматически)
    task_record = Task(task_id=task_id, conditions=data, conditions_excel=conditions_excel, solver=solver)
    db.add(task_record)
    db.commit()
    db.close()

    # Запускаем фоновую задачу
    executor = ThreadPoolExecutor(max_workers=1)
    executor.submit(process_task, task_id, model, solver)
    executor.shutdown(wait=False)  # не блокируем поток
    return jsonify({'task_id': task_id}), 202


# Фоновая функция для решения задачи
def process_task(task_id, model, solver):
    try:
        # Используем ThreadPoolExecutor для решения.
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(solve_model, model, solver)
            while not future.done():
                db = SessionLocal()
                task_record = db.query(Task).filter(Task.task_id == task_id).first()
                db.close()
                if task_record.canceled == True:
                    return
                time.sleep(1)
            solution = future.result()

        # Обновляем запись в БД – сохраняем решение и время завершения
        db = SessionLocal()
        task_record = db.query(Task).filter(Task.task_id == task_id).first()
        task_record.solution = solution
        finish_time = datetime.now(timezone.utc)
        task_record.solve_time = finish_time
        db.commit()
        db.close()
    except Exception as e:
        db = SessionLocal()
        task_record = db.query(Task).filter(Task.task_id == task_id).first()
        finish_time = datetime.now(timezone.utc)
        task_record.solve_time = finish_time
        db.commit()
        db.close()

# Эндпоинт для загрузки Excel и запуска фоновой задачи
@app.route('/task/excel', methods=['POST'])
def upload_excel():
    # Проверка наличия файла в запросе
    if 'file' not in request.files:
        return jsonify({'error': 'Вы не отправили файл'}), 400

    solver = request.form.get("solver")
    file = request.files['file']
    if not file.filename.endswith('.xlsx'):
        return jsonify({'error': 'Файл не является Excel файлом. Загрузите файл с расширением .xlsx'}), 400

    # Парсинг Excel файла
    df = None
    try:
        df = pd.read_excel(file, engine='openpyxl')
    except Exception as e:
        return jsonify({'error': f'Ошибка в чтении Excel файла: {str(e)}'}), 500
  
    # Валидация данных
    try:
        validate_data(df)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    # Конвертация в JSON структуру
    try:
       data = convert_to_json(df)
    except Exception as e:
        return handle_exception(e)

    # Создание модели
    try:
        model = create_model(data)
    except Exception as e:
        return handle_exception(e)

    # Записываем DataFrame в Excel в памяти
    try:
        output = BytesIO()
        df.to_excel(output, index=False)
        excel_bytes = output.getvalue()
        
        # Кодируем в base64 и возвращаем строку
        b64_excel = base64.b64encode(excel_bytes).decode('utf-8')
    except Exception as e:
        return handle_exception(e)

    task_id = str(uuid.uuid4())
    db = SessionLocal()
    # Создаем запись в БД (upload_time установится автоматически)
    task_record = Task(task_id=task_id, conditions=data, conditions_excel=b64_excel, solver=solver)
    db.add(task_record)
    db.commit()
    db.close()

    # Запускаем фоновую задачу
    executor = ThreadPoolExecutor(max_workers=1)
    executor.submit(process_task, task_id, model, solver)
    executor.shutdown(wait=False)  # не блокируем поток
    return jsonify({'task_id': task_id}), 202


# Эндпоинт SSE для получения обновлений по задаче
@app.route('/task/task_progress/<task_id>', methods=['GET'])
def task_progress(task_id):
    def event_stream():
        # Отправляем данные до тех пор, пока задача не завершена
        while True:
            session = SessionLocal()
            task_record = session.query(Task).filter(Task.task_id == task_id).first()
            session.close()
            if not task_record:
                yield "data: [error]" + "\n\n"
                break
            if task_record.solve_time is None:
                yield "data: Задача в процессе выполнения...\n\n"
            else:
                # Задача завершена: если решение есть, отправляем его как JSON; иначе — сообщение об ошибке
                if task_record.solution:
                    payload = {}
                    payload["solution"] = task_record.solution
                    payload["conditions_excel"] = task_record.conditions_excel
                    payload["solver"] = task_record.solver
                    payload["solve_duration"] = (task_record.solve_time - task_record.upload_time).total_seconds() * 1000
                    
                    yield "data: " + json.dumps(payload, ensure_ascii=False) + "\n\n"
                else:
                    yield "data: [error]" + "\n\n"
                    break
            time.sleep(1)
        yield "data: [end]\n\n"
    return Response(event_stream(), mimetype="text/event-stream")

# Эндпоинт отмены решения задачи
@app.route('/task/cancel_task/<task_id>', methods=['POST'])
def cancel_task(task_id):
    session = SessionLocal()
    task_record = session.query(Task).filter(Task.task_id == task_id).first()
    
    if not task_record:
        session.close()
        return jsonify({"error": "Задача не найдена"}), 404
    # Устанавливаем флаг отмены
    task_record.canceled = True
    session.commit()
    session.close()
    return jsonify({"message": "Задача отменена"}), 200

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
