## Rules for prompting
- Be clear and specific
- Give context (documentation, guidelines, libraries, ...)
- Be concise
- Break down long features into smaller features
- Constently create and update unit tests
- Tell Claude what not to do.

## The framework for building new application
- Define the scope
- Clarify the requirements
- Define the MVP (Minimum Viable Product)
- Choose the tech stack
- Create the implementation plan (what do we build first, second, third)

Here are the steps to follow
- Create a **project-scope.md** with the following information (Title, Problem, Solution, Features).
- Ask Claude to review the scope
  - Prompt: Read @project-scope.md review it and ask me clarifying questions. Help me find gaps or things I haven't thought through.
Once the **project-scope.md** is updated is important to know what goes into the MVP (Minimum Viable Product).
- The MVP should only contain the most important / basic features that go into version 1.0

### Tech Stack
You can ask Claude for suggestions about the tech stack
- Prompt: Suggest a tech stack for this project.
- Once suggestions are given ask Claude Code to refine them according to your need.
- Ask Claude to store the Tech Stack into **tech-stack.md**
  - Prompt: Store the tech stack into **tech-stack.md**

### Creating an implementation plan

Once we have our **project-scope.md** and **tech-stack.md**
We can create a **implementation-plan.md** file to know what to implement first.

Here is a prompt example for the implementation plan:
```text
Create an implementation plan. Break the project into small tasks and group them into phases.
```

Once you have created all your documents
- project-scope.md
- tech-stack.md
- implementation-plan.md

You can ask Claude to create the project:
Here is a prompt example
```text
Create a full-stack project with Express, React, Typescript and Bun.
Use context7 for up-to-date docs.
```

### Creating a momory file Claude.md
Here is a prompt example
```text
Create the project memory file claude.md. Ask context7 to fetch up-to-date documentation.
```

## Extending Claude

- MCP Servers: Give Claude access to external services (eg. Contexty7, GitHub)
- Skills: Give a set of instructions that teach Claude how to handle a specific task.

### Model Context Protocol (MCP)
Used to extend Claude to make it use external tools

For each MCP, there is
- MCP client
- MCP server

**Schema**
Agent -> MCP Client -> MCP Server -> GitHub

The MCP Client is embedded into the host application (Claude Code)

**Caution**
Only add the MCP that you need.
Adding an MCP adds tokens to your context window and may confuse Claude with too many options.

#### Adding tools

**Context 7**
It's an MCP server that fetches up to date documentation and inject it directly into your prompt.
- Agent -> MCP Client -> MCP Server -> Context7 -> Docs
- Website: context7.com
- Create an API Key
- Install command: `npx ctx7 setup--claude` (there are 2 options)
    - Remote installation
    - Local installation (this will install a local MCP Server)

Context7 uses 2 tools
- resolve-library-id: to get the id of the library.
- query-docs: to get the docs for the selected library id.
Once the MCP is installed all the tools descriptions are loaded into the context.

## Skills
Skills are a set of instructions that teach Claude how to handle a specific task.
- Only the `name` and the `description` of the task is loaded in the context.

Examples:
You want to do some recurrent tasks like
- Deploying your app
- Generate API documentation
- Write unit tests

Instead of repeating the instructions over and over, you can pu these instructions in a skill.

You can ask Claude for help when creating a skill
```text
create a custom skill called deploy.
When deploying, we should run all tests first, build the production bundle, and push to the staging area.
```

You can check available skills with the `/skills` command.  
Note that the name of a skill create a /command
- Example: if your skill is named `deploy`, your skill can be executed with `/deploy`

You can find skills online
- skillmp.com
  - frontend-design

## Checkpointing

Claude Code automatically saves the state of our code before each edit.
To undo
- Press the Esc button twice
- run the /rewind command
  - an interface will open, select the checkpoint to restore

Checkpointing, it only tracks changes by Claude editing tool
- So if Claude run a batch, these changes are not tracked
- It only works with changes within the current session (if you open another Claude session it won't rewind)

## Sub agents

A sub-agent is just a separate Claude instance with its own context window, its own system prompt and its own set of tools.
The sub-agent only sends back the main summary.

Allow to excute task in a separate context window.  
Let's say you want to execute a Unit Test task. In this case after the unit test execution, you don't want to keep all the details in your current context.  
You only need the summary of the result (e.g. all unit tests have passed).  
In this case, subagents are useful because they act as a fire and forget task and they don't clutter your main context. All the execution is done in a separate context.

Example
- Running unit tests.
- Fetching documentation.
- Processing log files.
- Exploring a large code base.

There are already built-in sub-agents

You can create
- Project agent (.claude/agents/)
- Personal (~/.claude/agents/)

## Plugins

To get notifications on VSCode, you might install the following Open-Source plugin
- agent-notifications
  - https://github.com/777genius/agent-notifications

## Claude Main Commands

↑ + Enter to go in multiline
↑ + Tab to switch the mode you are using

! for bash commands
/ for commands
@ for file paths
& for background
? To see all these options

To launch Claude: `claude`
If you want to start Claude with the previous context, type
- `claude --resume`

## Claude commands

/login to connect to Claude
/model select Claude model
/init create the memory file CLAUDE.md
/mcp to access all installed MCP
/btw to ask side questions
/skills to see all available skills
/agents to manage sub-agents
/voice to enable push-to-talk dictation

/btw to ask a side question
/rewind rewind changes in the current session to a previous checkpoint (a checkpoint is created after every change made by Claude Code).

### Contexts

/context check the context memory
/compact compact the context memory
/clear clear the memory context. Always clear the context window if you are dealing with unrelated tasks to save tokens

### Costs

/cost to check the cost if you are using the API
/usage to check the usage if you have a subscription

/terminal-setup Install Shift+Enter binding for multiline requests

!!!NEXT: 14- Adding skills