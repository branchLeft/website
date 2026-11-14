import { TrendingUp, Leaf, Brain, Heart, Code, Activity, AlertCircle } from 'lucide-react';
import type { Value } from '@branchleft/components';

/** The values, shown in full on /about and as a strip on the home page. */
export const VALUES: readonly Value[] = [
  {
    title: 'Sustainability & Longevity',
    icon: TrendingUp,
    accent: 'sustainability',
    body: "We have a laser focus on stable growth according to the means of the organisation. We don't answer to any external investors or private equity, and never will. We don't need to make profits to extract any surplus. We keep our costs low and our pricing fair, so that you can continue to work with us long-term. We enable this through engineering excellence and democratic decision-making.",
  },
  {
    title: 'Environmental Impact',
    icon: Leaf,
    accent: 'environment',
    body: 'All projects we work on are assessed for their environmental impact. We calculate the emissions of our deployed infrastructure and tool usage, and offset them such that we are carbon neutral. We proactively seek out work which helps address the climate crisis and reduces environmental harm.',
  },
  {
    title: 'Responsible AI',
    icon: Brain,
    accent: 'ai',
    body: 'We recognise the ethical, societal and environmental implications of artificial intelligence. AI can be leveraged to build solutions at pace that are a net-benefit to society. Where AI tools are used in software development, we use the most ethical options and use them responsibly. Where AI is used as part of the software we build, we work to ensure that it eliminates bias and uses models that are open source and auditable.',
  },
  {
    title: 'Societal Impact',
    icon: Heart,
    accent: 'society',
    body: 'We actively seek out work which has a positive societal impact. We are a catalyst and force-multiplier for people who do good. We find strategic ways to provide our services at low costs to organisations doing this work, without seeking any profit.',
  },
  {
    title: 'Open Source',
    icon: Code,
    accent: 'opensource',
    body: 'All code that we write by default is open source and given permissive licenses. Nobody wins when the same problem that the world faces needs to be solved many times over. We foster a virtuous cycle of development and improvement between ourselves, our clients, and the wider open source community. We actively contribute to, and ideally sponsor, open source projects that we rely on.',
  },
  {
    title: 'Agility',
    icon: Activity,
    accent: 'agility',
    body: 'We adapt quickly to a rapidly evolving world. We engineer our solutions to avoid lock-in to vendors or platforms. We build solutions that allow you to migrate away from us, and we demonstrate why you should stay.',
  },
  {
    title: 'Red Lines',
    icon: AlertCircle,
    accent: 'redlines',
    body: 'We do not work with clients or on projects that are exploitative, extractive, or harmful to people or planet, anywhere in the world. Where possible, we avoid financially supporting any organisation engaged in or complicit in the climate crisis, human rights violations, armed conflict, or other forms of harm. We hold a clear political position, but are not affiliated or aligned with any political party.',
  },
];
