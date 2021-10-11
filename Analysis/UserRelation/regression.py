# This program reads all the records from the database and performs a 
# logistic regression to determine the coefficents and store them in 
# UserRelationshipCoefficients table

# COnnection to db
from operator import mod
import pymysql
import pymysql.cursors
import sshtunnel

# Dataframes
import pandas as pd

# ML
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

tunnel = 0
database : pymysql.Connection = 0

def connectToDatabaseOverSSH():
    global tunnel
    global database
    tunnel = sshtunnel.SSHTunnelForwarder(
        ('prod022ws08.itesm.mx', 22), 
        ssh_username='A01023646',
        ssh_password='TEC.Lalongo1606', 
        remote_bind_address=('prod022ws08.itesm.mx', 3306)
    )
    tunnel.start()
    print("Connected to SSH Tunnel")
    database = pymysql.connect(
            host='localhost', 
            user='DataUser', 
            password='TEC.F4keNews', 
            database='FakeNews', 
            port=tunnel.local_bind_port,
            max_allowed_packet=1073741824,
            
    )
    print("Connected to Database")

def trainModel(df):
    X_train, X_test, y_train, y_test = train_test_split(df[['simCommunity', 'simMentions', 'simRetweets', 'simHashtags', 'simProfile']], df.verificationResult, random_state=2, stratify=df.verificationResult)
    model = LogisticRegression(max_iter=100000, tol=0.005, fit_intercept=False)
    model.fit(X_train, y_train)

    results = {
        'simCommunity': model.coef_[0][0],
        'simMentions': model.coef_[0][1], 
        'simRetweets': model.coef_[0][2], 
        'simHashtags': model.coef_[0][3], 
        'simProfile': model.coef_[0][4], 
        'score': model.score(X_test, y_test)
    }
    return results

connectToDatabaseOverSSH()
cursor : pymysql.cursors.Cursor = database.cursor()
try:
    data = pd.read_sql("""
        SELECT * FROM  UserRelationAnalysis WHERE verificationResult IS NOT NULL
    """, con=database)
    # print(data.head())
    print(trainModel(data))
except:
    print("Error")
finally:
    cursor.close()
    tunnel.close()

