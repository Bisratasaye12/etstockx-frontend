import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Link } from "@/shared/i18n/routing";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

const HERO_IMAGE = "/building.jpg";
const LISTING_IMG_1 = "/CBE-building.jpg";
const LISTING_IMG_2 = "/ethiotelecom.jpg";

export async function HomeLanding() {
  const t = await getTranslations("home");

  const features = [
    { Icon: Award, title: t("feature1Title"), body: t("feature1Body") },
    { Icon: Shield, title: t("feature2Title"), body: t("feature2Body") },
    { Icon: TrendingUp, title: t("feature3Title"), body: t("feature3Body") },
  ] as const;

  const steps = [
    {
      n: 1,
      title: t("processStep1Title"),
      body: t("processStep1Body"),
    },
    {
      n: 2,
      title: t("processStep2Title"),
      body: t("processStep2Body"),
    },
    {
      n: 3,
      title: t("processStep3Title"),
      body: t("processStep3Body"),
    },
  ] as const;

  const listings = [
    {
      image: LISTING_IMG_1,
      title: t("listing1Title"),
      body: t("listing1Body"),
      price: t("listing1Price"),
      brokers: t("listing1BrokerCount"),
    },
    {
      image: LISTING_IMG_2,
      title: t("listing2Title"),
      body: t("listing2Body"),
      price: t("listing2Price"),
      brokers: t("listing2BrokerCount"),
    },
  ] as const;

  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="grid gap-12 py-10 md:grid-cols-2 md:items-center md:gap-16 md:py-16 lg:py-20">
        <div className="flex flex-col gap-6">
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 text-primary w-fit gap-1.5 px-3 py-1 font-normal"
          >
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
            {t("heroBadge")}
          </Badge>
          <h1 className="font-heading text-foreground text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl lg:text-[3.25rem]">
            {t("heroTitleBefore")}{" "}
            <span className="text-primary">{t("heroTitleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "shadow-primary/25 h-11 px-6 shadow-md",
              )}
            >
              {t("ctaGetStarted")}
            </Link>
            <Link
              href="/market"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-6",
              )}
            >
              {t("ctaBrowseListings")}
            </Link>
          </div>
        </div>
        <div className="relative">
          <Image
            src={HERO_IMAGE}
            alt=""
            width={720}
            height={540}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="bg-muted/50 -mx-4 rounded-2xl px-4 py-16 sm:-mx-6 sm:px-6 md:py-20"
      >
        <div className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-3">
          {features.map(({ Icon, title, body }) => (
            <Card
              key={title}
              className="border-border/80 bg-card shadow-sm ring-0"
            >
              <CardContent className="flex flex-col gap-4 pt-6">
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="font-heading text-foreground text-lg font-semibold">
                  {title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Process */}
      <section id="how-it-works" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-foreground text-3xl font-bold tracking-tight md:text-4xl">
            {t("processTitle")}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {t("processSubtitle")}
          </p>
        </div>
        <div className="relative mx-auto mt-14 max-w-[1400px]">
          <div
            className="border-muted-foreground/20 pointer-events-none absolute top-8 right-[12%] left-[12%] hidden border-t-2 border-dashed md:block"
            aria-hidden
          />
          <div className="grid gap-12 md:grid-cols-3 md:gap-6">
            {steps.map((step) => (
              <div
                key={step.n}
                className="relative flex flex-col items-center text-center"
              >
                <span className="bg-primary text-primary-foreground mb-5 flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow-md">
                  {step.n}
                </span>
                <h3 className="font-heading text-foreground font-semibold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section id="featured" className="scroll-mt-24 pb-16 md:pb-24">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-heading text-foreground text-2xl font-bold tracking-tight md:text-3xl">
              {t("featuredTitle")}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              {t("featuredSubtitle")}
            </p>
          </div>
          <Link
            href="/market"
            className="text-primary hover:text-primary/90 inline-flex items-center gap-1 text-sm font-semibold"
          >
            {t("featuredViewAll")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {listings.map((item) => (
            <Card
              key={item.title}
              className="border-border/80 overflow-hidden shadow-md ring-0 py-0"
            >
              <CardContent className="flex flex-col gap-0 p-0 sm:flex-row">
                <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-[220px] sm:w-44 mr-4">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover sm:rounded-l-xl"
                    sizes="(max-width: 640px) 100vw, 176px"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5 sm:py-5 sm:pr-5 sm:pl-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <h3 className="font-heading font-semibold">{item.title}</h3>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {t("listingVerified")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.body}
                  </p>
                  <div>
                    <Link
                      href="/market"
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "sm" }),
                        "text-primary",
                      )}
                    >
                      {t("listingDetails")}
                    </Link>
                  </div>
                  <div className="border-border mt-auto flex flex-wrap gap-6 border-t pt-4 text-xs">
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wide">
                        {t("listingIndicativePrice")}
                      </p>
                      <p className="text-foreground mt-0.5 font-semibold tabular-nums">
                        {item.price}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground uppercase tracking-wide">
                        {t("listingAvailableVia")}
                      </p>
                      <p className="mt-0.5 font-semibold">
                        <span className="text-primary">{item.brokers}</span>{" "}
                        {t("listingBrokers")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="pb-16 md:pb-24">
        <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl px-6 py-12 md:px-14 md:py-16">
          <div
            className="bg-primary-foreground/10 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl"
            aria-hidden
          />
          <div
            className="bg-primary-foreground/5 pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              {t("ctaBannerTitle")}
            </h2>
            <p className="text-primary-foreground/90 mt-4 text-base leading-relaxed md:text-lg">
              {t("ctaBannerSubtitle")}
            </p>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "text-primary mt-8 inline-flex h-12 px-8 font-semibold shadow-lg",
              )}
            >
              {t("ctaBannerButton")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
