# The Emerging "Harness Engineering" Playbook

### The converging best practices for building with coding agents, from OpenAI to Stripe to OpenClaw.

  
Earlier this month, Greg Brockman [published a thread](https://substack.com/redirect/ae8908b9-1e9f-49bd-b382-a44d6dc64db6?j=eyJ1IjoiMm5rNGg4In0.-xNvGkTLq9x9vp-tz_y5B1kkQ24055iWAnuJqp4ILvs) about how OpenAI is retooling its engineering teams to make them more effective with agents. The initiative was kicked off because of how much things have changed internally:

> Some great engineers at OpenAI yesterday told me that their job has fundamentally changed since December. Prior to then, they could use Codex for unit tests; now it writes essentially all the code and does a great deal of their operations and debugging. Not everyone has yet made that leap, but it’s usually because of factors besides the capability of the model.

I’ve [previously mapped the progression](https://substack.com/redirect/66913a51-9749-45f1-b5d5-631f003d3dbd?j=eyJ1IjoiMm5rNGg4In0.-xNvGkTLq9x9vp-tz_y5B1kkQ24055iWAnuJqp4ILvs) from Copilot to chatbots to agents to background agents to agent fleets. Each step happened faster than the last. But in the last few months, something qualitatively different has started to emerge - yes, the models have gotten better, but we’re also seeing concrete evidence of what happens when entire teams reorganize around them.

Consider the following data points:

  - * 

Peter Steinberger, creator of OpenClaw, [told the Pragmatic Engineer](https://substack.com/redirect/26f9c3f5-21f6-4ff8-883d-0d8461fb36d2?j=eyJ1IjoiMm5rNGg4In0.-xNvGkTLq9x9vp-tz_y5B1kkQ24055iWAnuJqp4ILvs) he ships code he doesn’t read. One person, 6,600+ commits in a month, running 5-10 agents simultaneously.

An OpenAI team [built a million-line internal product](https://substack.com/redirect/faced674-aa17-498f-aa44-fb80293dd09f?j=eyJ1IjoiMm5rNGg4In0.-xNvGkTLq9x9vp-tz_y5B1kkQ24055iWAnuJqp4ILvs) over five months with three engineers. Zero lines of hand-written code (by design). An average throughput of 3.5 PRs per engineer per day - and the throughput increased as the team grew.

Stripe’s internal coding agents, called [Minions](https://substack.com/redirect/2036227e-92dd-4439-b4d7-8845cf6d0fcc?j=eyJ1IjoiMm5rNGg4In0.-xNvGkTLq9x9vp-tz_y5B1kkQ24055iWAnuJqp4ILvs), now produce over a thousand merged pull requests per week. A developer posts a task in Slack; the agent writes the code, passes CI, and opens a PR ready for human review, with no interaction in between.

To me, it’s clear we’re past the point of demos and side projects; these are production systems at real scale. And while the specifics differ - Steinberger is a solo practitioner, the OpenAI team is a small squad, Stripe is a 10,000-person company - the patterns they’ve converged on are remarkably similar.¹

This post is my attempt to map those patterns. The practices are still emerging and will undoubtedly evolve, but they’re converging fast enough that it’s worth writing down what’s becoming clear.

[Upgrade to paid](https://substack.com/redirect/2/eyJlIjoiaHR0cHM6Ly93d3cuaWdub3JhbmNlLmFpL3N1YnNjcmliZT91dG1fc291cmNlPXBvc3QmdXRtX2NhbXBhaWduPWVtYWlsLWNoZWNrb3V0Jm5leHQ9aHR0cHMlM0ElMkYlMkZ3d3cuaWdub3JhbmNlLmFpJTJGcCUyRnRoZS1lbWVyZ2luZy1oYXJuZXNzLWVuZ2luZWVyaW5nJnI9Mm5rNGg4JnRva2VuPWV5SjFjMlZ5WDJsa0lqb3hOakExTURJME5EUXNJbWxoZENJNk1UYzNNVGMzTkRJek15d2laWGh3SWpveE56YzBNelkyTWpNekxDSnBjM01pT2lKd2RXSXRNVFF3TnpVek9TSXNJbk4xWWlJNkltTm9aV05yYjNWMEluMC5EVlByMW5LU0NkUEZoOGhzeXQtMl80MWdOMG5vZ2hOY01xNVpxS1ZFaGo4IiwicCI6MTg4Nzc4OTA0LCJzIjoxNDA3NTM5LCJmIjp0cnVlLCJ1IjoxNjA1MDI0NDQsImlhdCI6MTc3MTc3NDIzMywiZXhwIjoyMDg3MzUwMjMzLCJpc3MiOiJwdWItMCIsInN1YiI6ImxpbmstcmVkaXJlY3QifQ.3quvsC6YEFt7FrrgvmYCNz4XpMnNlVWrkzN133FkNOg?&utm_medium=email&utm_source=subscribe-widget&utm_content=188778904)

## The Engineer’s Job Is Splitting In Two

In this moment, I’m seeing the AI space reflect and evolve my own observations on [the shift from a maker’s schedule to a manager’s schedule](https://substack.com/redirect/585383be-1d92-4522-867b-d623e1ca72fc?j=eyJ1IjoiMm5rNGg4In0.-xNvGkTLq9x9vp-tz_y5B1kkQ24055iWAnuJqp4ILvs):

> I’m moving away from chatting with AIs and moving towards managing them. You can see the progression of these tools. Today, they’re primarily designed around coding, but it’s a very short leap to augment them for general-purpose knowledge work. Which means those of us at the cutting edge will shift our schedules and workflows from those of makers to those of managers.

[](https://substack.com/redirect/585383be-1d92-4522-867b-d623e1ca72fc?j=eyJ1IjoiMm5rNGg4In0.-xNvGkTLq9x9vp-tz_y5B1kkQ24055iWAnuJqp4ILvs)| | | 

 