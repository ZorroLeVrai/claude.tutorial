# Introduction

There are 2 types of authentication systems
- Managed Service
  - Example: auth0 and Clerk
  - Pros
    - Speed
    - Reliability
  - Cons
    - Cost (Free for a small number of Users)
    - Lack of control (The user data sits on their platform)
- Custom (Build Your Own)
  - Create your own authentication system using libraries like: Auth.js or better-auth (framework for Typescript).
  - Pros
    - Free
    - Full control on user data
  - Cons
    - Auth.js can be difficult to configure (better-auth is easier to use)
    - You have full responsability over the security

When creating you own authentication, you have to understand
- How auth works
- Sessions
- Tokens
- Password hashing
- Role-based access

# Concepts

## Session
When a user logged-in, we need a way to remember that a user logged-in. That way when they make further requests, we don't ask them each time to log in.
A session is how the server knows who you are after you have logged in.

There are 2 commons approaches
- Database sessions
  - When a user logs in, the server creates a session and stores it in a database (a session has a unique id). The server send the session id to the client inside a Cookie. Everytime the client makes a request, it sends that Cookie along with it. The server checks that the session id exists in the database to know if the user is legit and what kind of user it is.
  - Pros: if a user is compromised or disconnected you can immediately delete the session from the database and no other user can have access.
  - Cons: With this approach, there is a database look-up for every client request. For large applications, those database look-up can add up.
- Json Web Token (JWT)
  - when a user logs in, the server creates a Token. A Token is just a piece of data (A JSON object with basic information such as User ID, Name, Role, Email + the server digitally signs the token). The signature means that the Token information can't be changed. The token is sent to the client when it logs in. The client has to send the Token (JWT) with every request.
  - Pros: when the server receives the request, it does not to look up anything in the database. It just checks the signature to make sure the data has not been tampered with and then it reads up the user info directly from the Token.
  - Cons: If the Token is hacked, the hacker gains access to the system. Tokens have generally a life span of 15 to 20 minutes and then they have to be renewed (this is to avoid getting long access to a system by hacking the Token).

If security is your first concern choose
- Database sessions
If scalability is your first concern choose
- Json Web Token (JWT)

