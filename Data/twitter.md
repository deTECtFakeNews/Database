# Connection/Twitter

## About
This module allows to perform GET and POST operations on the Twitter API with special consideration for delay times, endpoint access and multiple client pooling. The default export is an object of `TwitterPool`.

## Endpoints (`TwitterClientEndpoint`)
The Twitter API provides several endpoints or routes from which to obtain data. However there is a rate limit for the number of available requests in a specified time period, which varies from each endpoint. Thus, a delay must be specified in order to prevent exceeding the quota limits. The API also returns information on the remaining calls and limit reset date for each endpoint, which can be used to calculate the delay.

### `remainingCalls : Number`
Number of requests remaining in this time window.

### `limitResetDate : Date`
Date and time at which the limit will be reset (thus closing a cycle). After this date and time, remaining calls will be complete again regardless of the number of executions on the previous cycle. 

### `getDelay() : Number`
Uses the current date, the limit reset date and the remaining calls to calculate the number of milliseconds to wait in order to not exceed the quota limits. Only possitive values are returned.

## Client (`TwitterClientExtended`)
In this context, a Twitter client refers to an individual account or application (identified by the access tokens) that can make requests to the Twitter API. It is important to know that not all Twitter clients have access to the same endpoints. For example access to the full archive search is invite only and limited to a certain number of accounts. The client should manage availability and verification of endpoints and the handling of HTTP requests including the appropiate authentication values. It should also respect each endpoint delay time during execution. 

### `id : Number`
Assigns an auto increment number to each client, for easier identification.

### `endpoints : {String, TwitterClientEndpoint}`
Dictionary containing all the available endpoints for the current client. They are associated to a string of the normalized endpoint form. 

### `getEndpoint(path : String) : TwitterClientEndpoint`
Given a string `path`, it performs several operations to obtain the normalized form of the endpoint. The TwitterClientEndpoint associated with such key in the `endpoints` object is returned.

### `get(path : String, params : Object, callback : function (error, data, response)) : void`
Issues a HTTP GET request with the appropriate credentials in the header to the specified path. It automatically gets the relevant TwitterClientEndpoint object to delay the execution, and updates the `remainingCalls` and `limitResetDate` values from the response. It also calls the callback function for integration with other pieces of code. 

### `post(path : String, params : Object, callback : function (error, data, response)) : void`
Works exactly the same as `get()` but issues a HTTP POST request instead.

## Pooling (`TwitterPool`)
Each client is limited to a certain number of endpoints, limited by time constraints. In order to increase the amount of requests made in a time period, several clients can be used. This allows making requests from one client while the other is awaiting. The pool is responsible for automatically selecting a client based on endpoint availability (e.g., access to full archive search) and lowest delay time. The pool is exposed to the rest of the layers in the system so that they can make requests from it without worrying about the clients or delay times. 

## `clients[] : Array<TwitterClientExtended>`
Array of all the clients available

## `getAvailableClient(path : String) : TwitterClientExtended`
Given a `path` returns the `TwitterClientExtended` object for which an endpoint exists, with the smallest delay time.

## `get(path: String, params: Object, callback : function (error, data, response)) : void`
Executes the `get()` method of the `TwitterClientExtended` returned by `getAvailableClient()`

## `post(path: String, params: Object, callback : function (error, data, response)) : void`
Executes the `post()` method of the `TwitterClientExtended` returned by `getAvailableClient()`