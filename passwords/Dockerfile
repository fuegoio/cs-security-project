FROM python:3.7.3-stretch

RUN mkdir -p /app
WORKDIR /app

ADD requirements.txt .
RUN pip install -r requirements.txt

ADD passwords.py /app/

CMD ["gunicorn","-w","1","--bind","0.0.0.0:8000","passwords:app"]
