# 5ps

A copy-paste prompt that helps an agent write and revise a 5Ps plan of any size.

Always have a plan. Always. A plan without dates is fantasy. The 5Ps are Purpose, Principles, Priorities, People, and Plan. The five headings do not change. The depth does. A summer internship and a program with thousands of people use the same shape.

The teaching is in [The 5Ps](https://blog.kindel.com/2011/06/14/the-5-ps-achieving-focus-in-any-endeavor/), [Have a Plan](https://blog.kindel.com/2013/03/02/have-a-plan/), and [Have a Plan (With Dates)](https://blog.kindel.com/2019/04/18/have-a-plan-with-dates/). This repo is the editor: `prompt.md`.

The prompt embeds three things so the agent does not have to go fetch them:

1. The five Ps, and how each one fails.
2. A strong subset of [Tig's writing voice](https://github.com/kindel/blog/blob/master/docs/writing-in-tigs-voice.md).
3. [Bedside](https://github.com/tig/bedside/tree/main/contract) manners: treat the human as smart and high-judgment, prefer doing over instructing, ask one question when blocked, never leave them at a cliff.

Principles are tenets. For the craft of that list, use [kindel/tenets](https://github.com/kindel/tenets).

Live: [https://kindel.com/5ps/](https://kindel.com/5ps/). There is no app. Copy [`prompt.md`](prompt.md) into any agent, then describe the endeavor or paste a draft plan.

## Use

1. Copy [`prompt.md`](prompt.md).
2. Paste it into any agent.
3. Tell it the endeavor, or paste the current plan.

If the plan is soft (unnamed people, no end date, everything is P1), a good run will say so and fix it. If the input is too thin to take a stand, it should ask one question and wait.

## What you should get back

A working 5Ps in the document shape (five `##` headings, Principles in the tenets-for-tenets list format, a Plan that starts with an end date), a short editor note on each P, a review against the five, and a few debate questions the room should actually fight about.

## Related

- [The 5Ps](https://blog.kindel.com/2011/06/14/the-5-ps-achieving-focus-in-any-endeavor/)
- [Have a Plan](https://blog.kindel.com/2013/03/02/have-a-plan/)
- [Have a Plan (With Dates)](https://blog.kindel.com/2019/04/18/have-a-plan-with-dates/)
- [Tenets](https://blog.kindel.com/2020/02/10/tenets/)
- [kindel/tenets](https://github.com/kindel/tenets)
- [Bedside contract](https://github.com/tig/bedside/tree/main/contract)
- [Writing in Tig's Voice](https://github.com/kindel/blog/blob/master/docs/writing-in-tigs-voice.md)
