# This program reads all the records from the database and performs a 
# logistic regression to determine the coefficents and store them in 
# UserRelationshipCoefficients table

# import mysql.connector
import pymysql
import sshtunnel
import pandas as pd
import logging
import time

def connectToDatabaseOverSSH():
    with sshtunnel.SSHTunnelForwarder(
        ('prod022ws08.itesm.mx', 22), 
        ssh_username='A01023646',
        ssh_password='TEC.Lalongo1606', 
        remote_bind_address=('prod022ws08.itesm.mx', 3306)
    ) as tunnel:
        tunnel.start()
        print("Connected to SSH Tunnel")
        database = pymysql.connect(
                host='localhost', 
                user='DataUser', 
                password='TEC.F4keNews', 
                database='FakeNews', 
                port=tunnel.local_bind_port,
                max_allowed_packet=67108864,
                autocommit=True
        )
        print("Connected to Database")
        return database

with connectToDatabaseOverSSH() as database:
    cursor = database.cursor()
    cursor.execute("SELECT VERSION()")
#    data = pd.read_sql('SELECT * FROM UserRelationAnalysis WHERE verificationResult IS NOT NULL LIMIT 20', con=database)
#    data.head()

