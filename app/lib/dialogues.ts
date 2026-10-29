// Night dialogues — scripted conversations between the two modern residents.
// Psychology as theatre: no API key required, the knowledge is in the script.

import type { CharacterId } from "../characters";

export interface DialogueTurn {
  who: Extract<CharacterId, "seligman" | "csik">;
  text: string;
}

export interface DialogueScene {
  id: string;
  title: string;
  titleEn: string;
  turns: DialogueTurn[];
  ask?: string; // a question left to the visitor at the end
}

export const SCENES: DialogueScene[] = [
  {
    id: "happiness-vs-flow",
    title: "快乐是副产品",
    titleEn: "Happiness, a by-product",
    turns: [
      { who: "seligman", text: "米哈里，人们总来问我：怎样才能快乐。我越来越不敢直接回答。" },
      { who: "csik", text: "因为直接追求快乐的人，往往两手空空。我的受访者里，最幸福的那些人几乎从不谈论幸福。" },
      { who: "seligman", text: "他们谈论什么？" },
      { who: "csik", text: "他们谈论正在做的事：一张要修的桌子，一段要练的旋律。快乐是他们回头时才看见的东西。" },
      { who: "seligman", text: "所以我把问题换成了：什么让生活值得过。投入、意义、成就——快乐自己会来。" },
    ],
    ask: "回头看，你最近一次「顺便」感到快乐，当时正在做什么？",
  },
  {
    id: "attention",
    title: "注意力是最后的财产",
    titleEn: "The last property",
    turns: [
      { who: "csik", text: "马丁，我这辈子只确信一件事：你把注意力放在哪里，你的生活就是什么样子。" },
      { who: "seligman", text: "可注意力天生偏爱坏消息。一句批评盖过十句称赞——演化给我们装了一台负面探测器。" },
      { who: "csik", text: "所以注意力需要训练，像肌肉。心流就是注意力被一件值得的事完全占用的状态。" },
      { who: "seligman", text: "而感恩练习，是在一天结束时把注意力掰回到好事上。我们在做同一件事的两端。" },
    ],
    ask: "今天，你的注意力大部分花在了哪里？",
  },
  {
    id: "challenge",
    title: "恰好够不着的地方",
    titleEn: "Just out of reach",
    turns: [
      { who: "csik", text: "无聊和焦虑之间有一条窄缝：挑战略高于能力，手要伸一下才够得着。" },
      { who: "seligman", text: "伸一下够得着——这也是乐观的定义。悲观者看见够不着，就断定永远够不着。" },
      { who: "csik", text: "所以逃出无聊的办法不是休息，是加一点难度。给老任务换个限制，它就重新活了。" },
      { who: "seligman", text: "逃出焦虑的办法也不是逃，是拆。把够不着的拆成伸手可及的第一步。" },
    ],
    ask: "你手头有一件无聊或焦虑的事吗？它缺一个限制，还是缺一次拆分？",
  },
  {
    id: "helplessness",
    title: "习得的，就能再学回来",
    titleEn: "What is learned can be unlearned",
    turns: [
      { who: "seligman", text: "我年轻时的实验让我难过了很多年：受过无法逃避的电击的狗，后来有了逃生门也不逃了。" },
      { who: "csik", text: "它学会了「做什么都没用」。人也一样——几次失败之后，连容易的门也不推了。" },
      { who: "seligman", text: "但那个实验有一个被忽略的角落：总有三分之一的狗，无论如何都会再试。我后半生都在研究它们。" },
      { who: "csik", text: "它们有什么不同？" },
      { who: "seligman", text: "解释方式。它们把电击当作暂时的、局部的坏运气。无助是习得的——这意味着，它也能被重新学掉。" },
    ],
    ask: "有没有一扇你很久没推过的门？",
  },
  {
    id: "autotelic",
    title: "为了做而做",
    titleEn: "For its own sake",
    turns: [
      { who: "csik", text: "我造过一个词：autotelic——自成目的。为了做而做的事，报酬就在做的过程里。" },
      { who: "seligman", text: "孩子天生都是这样的。没有人付钱让他们搭积木。" },
      { who: "csik", text: "然后我们教会他们为分数、为薪水、为点赞。外部奖赏像租来的房子，随时会被收回。" },
      { who: "seligman", text: "所以优势测验的意义不是贴标签，是帮人找回那些做起来本身就有报酬的事。" },
      { who: "csik", text: "一个人只要还有一件自成目的的事，生活就塌不下来。" },
    ],
    ask: "你有哪件事，就算没有任何人知道，也会继续做？",
  },
  {
    id: "ordinary-days",
    title: "平常的一天",
    titleEn: "An ordinary day",
    turns: [
      { who: "seligman", text: "人们以为幸福研究关心高光时刻。其实我们整天研究的是星期二下午。" },
      { who: "csik", text: "我的传呼机实验正是这样：一天响八次，响了就记下此刻在做什么、感觉如何。" },
      { who: "seligman", text: "结果呢？" },
      { who: "csik", text: "最好的时刻很少在假期里。它们藏在专注的工作、投入的交谈、甚至洗碗里——只要人在场。" },
      { who: "seligman", text: "所以这间屋子让访客每天记一件小事。不是记录生活的例外，是练习在场于它的平常。" },
    ],
    ask: "今天这个平常的日子里，你最「在场」的一刻是什么时候？",
  },
];
