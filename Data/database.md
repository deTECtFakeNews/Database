# Connection/Database

## About
This module handles multiple connections to the database through an SSH tunnel in a way that allows simultaneous operations to be executed.

### Why multiple connections?
MUltiple connections allow to perform multiple SQL queries on the database simultaneously. This is extremely importatn when combined with **data streaming**, as it allows each result to be loaded into memory while other operations and SQL queries are executed. 

### Why use SSH tunneling?
Due to limitations on the server, connecting through SSH has proven the easiest and most reliable method. 

## Database SSH Connection (`DatabaseSSHConnection`)
Each individual connection to the database is established through an SSH tunnel using the following procedure:
- Create new SSH Client
- Connect to SSH server using SSH config keys
- When connection is established, forward ports to point to MYSQL server
- When stream to MYSQL is established, connect to MYSQL server using MYSQL config keys
- When connection to MYSQL is established, trigger pseudo-event `on('mysql-connection')`
- If connection drops at any point, trigger pseudo-event `on('close')`

### `config : {mysql: Object, ssh: Object}`
Contains configuration keys for ssh and mysql connections.

### `sshClient : ssh2.Client`
SSH client used to connect to SSH server.

### `mysqlConnection : mysql.Connection`
This is the actual Mysql connection to database. 

### `connect() : void`
Establishes a connection to the SSH server and then forwards it to the Mysql Server. It creates a connection to the database and stores it in the `mysqlConnection` property. When the `mysqlConnection` is ready, the event `mysql-connection` is triggered.

### `on(event : String, callback : function ) : void`
Allows to create callbacks for pseudo-events, including `mysql-connection` and `close`.

## Pooling (`DatabaseSSHConnectionPool`)
Multiple instances of `DatabaseSSHConnection` are required in order to perform simultaneous opperations on the database. Such connections need to be easily accesible and identifiable.

### `config : {mysql : Object, ssh : Object}`
Contains configuration keys for ssh and mysql connections. It is passed down to all connections.

### `sshConnections : {String, DatabaseSSHConnection}`
Key-Value pairs of `DatabaseSSHConnection` objects, where the key refers to its `name`.

### `connections : {String, mysql.Connection}`
Key-Value pairs of mysql Connections, where the key refers to its parent's name. 

### `addConnection(name : String) : Promise<void>`
Using data from the `config` property, this method creates a new `DatabaseSSHConnection` and stores it in `sshConnection` with the key `name`. Likewise, the `mysqlConnection` is stored in `connections`. The promise resolves once the connection with mySQL is successful. 

### `connect() : Promise<void>`
Creates the default connections to the database. 