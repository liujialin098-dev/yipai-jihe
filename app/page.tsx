import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  GitBranch,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          Starter Kit
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          已就绪
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="mb-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CheckCircle2
              className="size-4 text-emerald-600"
              aria-hidden="true"
            />
            App Router · TypeScript · Biome
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            一个干净、可靠的起点。
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            shadcn/ui 负责组件基础，lucide-react 负责图标，Biome 和 Git hook
            负责让每次提交保持整洁。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg">
              开始开发
              <ArrowUpRight aria-hidden="true" />
            </Button>
            <Button variant="outline" size="lg">
              查看项目结构
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          <Feature
            icon={Code2}
            title="现代栈"
            description="Next.js App Router 与 TypeScript"
          />
          <Feature
            icon={Sparkles}
            title="可组合 UI"
            description="shadcn/ui + lucide-react"
          />
          <Feature
            icon={GitBranch}
            title="提交卡控"
            description="format、safe lint fix、tscheck"
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Code2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <Icon
        className="mt-0.5 size-5 text-muted-foreground"
        aria-hidden="true"
      />
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
