import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

import { Container } from "@/components/shared/Container";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useSettings } from "@/features/settings/api/useSettings";
import { ROUTES } from "@/constants/routes";

export function FaqPage() {
  const { data: settings } = useSettings();
  const faqs = settings?.faqs ?? [];

  return (
    <>
      <Helmet>
        <title>FAQ — DiecastBD</title>
        <meta name="description" content="Frequently asked questions about DiecastBD's diecast collectibles, shipping, and orders." />
      </Helmet>

      <Container size="narrow" className="flex flex-col gap-8 py-16">
        <h1 className="text-center font-heading text-3xl text-foreground sm:text-4xl">
          Frequently Asked Questions
        </h1>

        {faqs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No questions published yet — reach out via our{" "}
            <Link to={ROUTES.CONTACT} className="text-primary hover:underline">
              contact page
            </Link>{" "}
            and we'll help directly.
          </p>
        ) : (
          <Accordion type="single" collapsible>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Container>
    </>
  );
}
