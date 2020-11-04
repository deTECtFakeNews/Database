## Database
Documentación y descripción de la base de datos que se usará para la creación de los modelos

## Users
Representa a un usuario en Twitter. Es importante conocer su información y analizar su relación con otros usuarios a modo de poder identificar comunidades. La base de datos cuenta con 3 tablas destinada a los usuarios

### Users
| campo             | tipo de dato  | descripción                                     |
| ----------------- | ------------  | ----------------------------------------------- |
| **userID**        | int(11)       | [Llave primaria] Funciona como identificador único del usuario |
| creationDate      | timestamp     | Indica la fecha de creación de la cuenta. Los bots y cuentas sospechosas tendrán menor tiempo en la plataforma |
| fullName          | varchar(25)   | Nombre completo del usuario, como aparece en su perfil |
| screenName        | varchar(25)   | Nombre de usuario (@username) de la cuenta. No es útil como identificador único ya que puede ser modificado |
| biography         | text          | Pequeña descripción de la cuenta. Puede usarse NLP para identificar sesgos políticos, sociales, etc. |
| isProtected       | boolean       | (Predeterminado: Falso) Indica si la cuenta es privada (i.e., visible a todo el público) |
| isVerified        | boolean       | (Predeterminado: Falso) Indica si la cuenta está verificada (i.e., Twitter asegura que quien usa la cuenta sea quien dice ser). Generalmente representan fuentes confiables |
| language          |  varchar(3)   | Regresa el identificador del lenguaje que fue identificado por el programa. Si no se detecta ninguno, retorna `und`. |
| placeDescription  | varchar(30)   | (Predeterminado: Nulo) Regresa la ubicación geográfica mostrada en el perfil.




### UserStatsFreeze
Agrupa las estadísticas de un usuario en un tiempo determinado. 

| campo             | tipo de dato  | descripción                                     |
| ----------------  | ------------  | ----------------------------------------------  |
| **userID**        | int(11)       | [Llave primaria y externa (User)] Id del usuario |
| updateDate        | timestamp     | (Predeterminado: timestamp actual) Fecha de última actualización de los datos |
| followersCount    | int           | Número de seguidores |
| followingCount    | int           | Número de seguidos |
| listedCount       | int           | Número de listas públicas a las que pertenece |
| favoritesCount    | int           | Número de tweets a los que el usuario ha dado *like* |
| statusesCount     | int           | Número de tweets (y retweets) publicados por el usuario |


### UserAnalysis
Tomando la información anterior, así como la información individual de cada tweet del usuario, se realizan algoritmos de análisis. La información relevante es almacenada aquí.
> Nota: por esa misma razón, los campos de esta tabla están sujetos a cambios.

| campo             | tipo de dato  | descripción                                      |
| ----------------- | ------------  | -----------------------------------------------   |
| **userID**        | int(11)       | [Llave primaria y externa (User)] Id del usuario |
| sentimentIndexAvg | float         | (Rango: -1 a 1) Promedio de `sentimentIndex` de todos los tweets publicados por el usuario, donde 0 es positivo, 1 es negativo y -1 es indefinido. |
| sentimentIndexStDev   | float     | Desviación estándar de `sentimentIndex` de todos los tweets publicados por el usuario. Permite observar la distribución de emociones y detectar sesgos. |
| sentimentIndexBio | float         | (Rango: -1 a 1) Hace *sentiment analysis* del contenido de la biografía del usuario y retorna un porcentaje en una escala de positivo a negativo. |
| tweetFrequency    | float         | Indica la frecuencia promedio con la que publica tweets el usuario en twwets/dia |
| keywords          | text          | Contiene las palabras claves identificadas, separadas por comas |
| analysisIndexAvg  | float         | Regresa el promedio de `analysisIndex` de los tweets publicados por el usuario. |
| analysisIndexStDev| float         | Regresa la desviación estándar de `analysisIndex` de todos los tweets, lo que permite ver distribución de valores e identificar sesgos |
| analysisIndex     | float         | Permite asignar un valor cuantitativo al análisis y almacenarlo para ser comparado con otros objetos. 


## Tweet
El Tweet es la unidad básica de información en Twitter. Sobre éstos (y su contenido) es que se enfoca el mayor análisis del proyecto. La base de datos cuenta con 3 tablas destinadas a los tweets.

### Tweet
| campo             | tipo de dato  | descripción                                       |
| ----------------  | ------------- | ------------------------------------------------  |
| **tweetID**       | int (11)      | [Llave primaria] Identificador único del Tweet en el sistema. |
| **authorID**      | int (11)      | [Llave externa (User)] Identificador único del usuario que escribió el Tweet |
| **inReplyToUserID** | int (11)    | [Llave externa (User)] (Predeterminado: -1) Identificador único del usuario al que responde el tweet, en caso de existir. |
| **inReplyToTweetID** | int (11)   | [Llave externa (Tweet)] (Predeterminado: -1) Identificador único del tweet al que responde este tweet, en caso de existir. |
| **quotesTweetID** | int (11)      | [Llave externa (Tweet)] (Predeterminado: -1) Identificador único del tweet que está siendo citado/incrustado en este tweet, en caso de existir alguno |
| creationDate      | timestamp     | Fecha de creación del tweet |
| fullText          | text          | Contenido textual del tweet |
| placeLng          | float         | (Predeterminado: Nulo) En caso de existir, la longitud de las coordenadas de la ubicación asociada con el tweet |
| placeLat          | float         | (Predeterminado: Nulo) En caso de existir, la latitud de las coordenadas de la ubicación asociada con el tweet |
| placeDescription  | varchar(30)   | (Predeterminado: Nulo) En caso de exisitir, el nombre de la ubicación asociada con el tweet |
| isPossiblySensitive | boolean     | (Predeterminado: Falso) Indica si el contenido es potencialmente sensible |


### TweetStatsFreeze
Agrupa las estadísticas y alcance del tweet en un instante determinado. 
| campo             | tipo de dato  | descripción                                       |
| ----------------  | ------------- | ------------------------------------------------  |
| **tweetID**       | int(11)       | [Llave primaria y externa (Tweet)] Identificador único del tweet |
| updateDate        | timestamp     | (Predeterminado: timestamp actual) Fecha y hora de la última actualización |
| retweetCount      | int           | Número de retweets |
| favoriteCount     | int           | Número de gente que ha indicado que le gusta |
| replyCount        | int           | Número de respuestas |

### TweetAnalysis
Tomando la información anterior, se realizan algoritmos de análisis. La información más relevante es presentada aquí. 
> Nota: por esa misma razón, los campos de esta tabla están sujetos a cambios.

| campo             | tipo de dato  | descripción                                       |
| ----------------  | ------------- | ------------------------------------------------  |
| **tweetID**       | int(11)       | [Llave primaria y externa (Tweet)] Identificador único del tweet |
| sentimentIndex    | float         | (Predeterminado: -1) Hace un *sentiment analysis* del contenido del tweet y da un resultado numérico en una escala 0-1, donde 0 es positivo y 1 es negativo |
| keywords          | text          | Identifica las palabras claves, separadas por comas |
| analysisIndex     | float         | Permite asignar un valor cuantitativo al análisis y almacenarlo para ser comparado con otros objetos. |


## Queries
A modo de poder realizar análisis, es necesario identificar la consulta que fue utilizada como punto de partida. A diferencia del resto de las tablas, los datos aquí serán ingresados en su mayoría por el usuario. 

### Query
| campo             | tipo de dato  | Descripción                                         |
| ----------------- | ------------- | --------------------------------------------------    |
| **queryID**       | int(11)       | [Llave primaria] Identificador único de la consulta   |
| executeDate       | timestamp     | (Predeterminado: timestamp actual) Fecha y hora de la última ejecución |
| resultType        | enum('recent', 'popular', 'mixed') | Ordenamiento utilizado: por popularidad, temporalidad, o recomendaciones. |
| language          | varchar(3)    | Idioma de preferencia para buscar los tweets |
| resultsCount      | int           | Indica el número de tweets regresados |

### QueryTweets
Permite identificar qué tweets fueron obtenidos con qué consultas
| campo             | tipo de dato  | descripción                                           |
| ---------------   | ------------- | ----------------------------------------------------- |
| **queryID**       | int(11)       | [Llave primaria y externa (Query)] Identificador único de la consulta |
| **tweetID**       | int(11)       | [Llave primaria y externa (Query)] Identificador único del tweet |
| resultType        | enum('recent', 'popular', 'mixed') | Ordenamiento utilizado: por popularidad, temporalidad, o recomendaciones. |

### QueryAnalysis
Al tratarse de una colección de tweets, sigue la misma estructura que `UserAnalysis`.

## Recursos y entidades
Falta implementación para tablas
* TweetEntities
* ResourcesAnalysis

La última tendrá un campo llamado credibilityIndex que indicará el índice de credibilidad