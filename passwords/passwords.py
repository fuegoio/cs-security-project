from flask import Flask

app = Flask(__name__)

TEMPLATE = """
<html>
<body>
<h2>Password manager</h2><br/><br/>
<table>
    <thead>
        <tr>
            <th>User</th>
            <th>Password</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Michel</td>
            <td>XpwM7MarZKVzDaQd</td>
        </tr>
        <tr>
            <td>Roger</td>
            <td>SjUDAixcyUDmqq6R</td>
        </tr>
    </tbody>
</table>
</body>
</html>
"""


@app.route("/")
def index():
    return TEMPLATE
