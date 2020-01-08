import time

from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}}, supports_credentials=True)


@app.route("/", methods=["POST"])
def store_result():
    timestr = time.strftime("%Y%m%d-%H%M%S")
    body = request.get_data()
    print(body)
    with open("./{}.txt".format(timestr), "wb") as file:
        file.write(body)
    return "Success"
