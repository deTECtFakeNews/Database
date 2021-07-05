# Connection
<img src="https://img.shields.io/badge/version-3.0-<COLOR>.svg">
<p>

At its most fundamental level, the scope of this project is **downloading data from Twitter into a database**. This is done through the Twitter API and a dedicated MySQL database hosted in a server. 
The connection layer, as the name implies, handles the connections to both of this services. At the same time, it serves as a middleware that ensures requests can be correctly and efficiently executed. It consists of two main modules: **twitter** and **database**.

## Connection/Twitter
This module allows to perform GET and POST operations on the Twitter API with special consideration for delay times, endpoint access and multiple client pooling. [Read more here.](./twitter.md)

## Connection/Database
This module handles multiple connections to the database through an SSH tunnel in a way that allows simultaneous operations to be executed. [Read more here.](./database.md)

## Connection/Constants
This JSON file contains all the configuration constants for this layer. This includes:
- Twitter API access tokens
- SSH connection keys
- MySQL connection keys

> The schema for this file is still under development and subject to change. It will be added to the documentation in a couple of days