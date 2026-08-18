# 5ps

A wizard that writes a custom 5Ps prompt, then opens it in an agent.

Always have a plan. Always. A plan without dates is fantasy. The 5Ps are Purpose, Principles, Priorities, People, and Plan. The five headings do not change. The depth does. A summer internship and a program with thousands of people use the same shape.

The teaching is in [The 5Ps](https://blog.kindel.com/2011/06/14/the-5-ps-achieving-focus-in-any-endeavor/), [Have a Plan](https://blog.kindel.com/2013/03/02/have-a-plan/), and [Have a Plan (With Dates)](https://blog.kindel.com/2019/04/18/have-a-plan-with-dates/). This repo is the editor.

The agent prompt is short. It tells the model to fetch the rules:

- Rules: [`rules.md`](rules.md), live at [https://kindel.com/5ps/rules.md](https://kindel.com/5ps/rules.md)
- Prompt: [`prompt.md`](prompt.md)

Principles are tenets. For the craft of that list, use [kindel/tenets](https://github.com/kindel/tenets).

Live: [https://kindel.com/5ps/](https://kindel.com/5ps/).

## Use

1. Open the wizard.
2. Write a Purpose with a by-when. "Deliver foo by May 2027" is a purpose. That date is also the Plan end date.
3. Add Principles, Priorities, and People. People can be a single line: `me (owner), sally (engineering), fred (pm), bob (accounting/informed)`.
4. On Plan, slide milestones between today and the end date. Drag the end to expand.
5. On any step, copy the prompt or open Claude, ChatGPT, or Grok with it filled in.

If the plan is soft (unnamed people, no end date, everything is P1), a good run will say so and fix it. A dated Purpose is not soft. If the input is too thin to take a stand, it should ask one question and wait.

## What you should get back

A working 5Ps (five headings, Principles in the tenets-for-tenets list format, a Plan that starts with an end date) and one short review: what was soft, where risk landed, and the fight the room should have.

## Related

- [The 5Ps](https://blog.kindel.com/2011/06/14/the-5-ps-achieving-focus-in-any-endeavor/)
- [Have a Plan](https://blog.kindel.com/2013/03/02/have-a-plan/)
- [Have a Plan (With Dates)](https://blog.kindel.com/2019/04/18/have-a-plan-with-dates/)
- [Tenets](https://blog.kindel.com/2020/02/10/tenets/)
- [kindel/tenets](https://github.com/kindel/tenets)
- [Bedside contract](https://github.com/tig/bedside/tree/main/contract)
- [Writing in Tig's Voice](https://github.com/kindel/blog/blob/master/docs/writing-in-tigs-voice.md)
