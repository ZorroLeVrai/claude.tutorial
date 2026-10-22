# Building a project from scratch

To build a project for scratch you can follow these steps
- create a project-scope.md file (see example in this folder)
  - Ask Claude to refine it
- Ask Claude to generate a tech stack for the whole project
  - Review the tech stack and ask Claude to make a few changes
  - Once the changes are made ask Claude to save the tech stack in tech-stack.md
- Ask Claude to generate an implmentation plan
  - Use this prompt: `create an implementation plan. break the project into small tasks and group them into phases. save the generated implementation plan in implementation-plan.md`.
  - Refine the implmentation plan and store it in `implementation-plan.md`.
- Ask Claude to tackle the scaffolding
  - Use this prompt: `create a full-stack project with express, react, typescript and bun. use context7 to get up-to-date documentation.`
- Use context7
  - Generate a context7 key for the project
  - Connect the project to the context7 (by executing the given command).
- Generate the memory file (claude.md)
  - You can use the following prompt: `create the project memory file claude.md and add an instruction in claude.md telling it to use context7 to fetch up-to-date documentation`.