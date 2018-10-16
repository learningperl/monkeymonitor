# coding:utf8

import htmlPy
import os
from mainp.options import op
from PySide import QtGui

app = htmlPy.AppGUI(title=u" ", width=1200, height=900, x_pos=300, y_pos=40, plugins=True, developer_mode=True,
                    allow_overwrite=True)

app.template_path = os.path.abspath(".")
app.static_path = os.path.abspath("./static/")
app.window.setWindowIcon(QtGui.QIcon("static/img/logo.png"))
be = op()
be.app = app

app.bind(be)
app.template = ("index.html", {})
app.start()
