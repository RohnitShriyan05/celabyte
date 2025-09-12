import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      question: "How does Celabyte connect to my database?",
      answer: "Celabyte uses secure, encrypted connections to your database. We support read-only access and can connect through VPNs, SSH tunnels, or direct connections. Your data never leaves your environment unless explicitly queried."
    },
    {
      question: "What databases are supported?",
      answer: "We support PostgreSQL, MySQL, MongoDB, BigQuery, Snowflake, Redshift, SQL Server, and many more. Our team can also work with you to add support for custom database systems."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We're SOC 2 Type II certified, GDPR compliant, and HIPAA ready. All connections are encrypted, we use industry-standard security practices, and your data remains in your control at all times."
    },
    {
      question: "How accurate are the AI-generated queries?",
      answer: "Our AI has been trained on millions of SQL queries and achieves 95%+ accuracy on most common business questions. For complex queries, we provide query explanations and allow you to review the generated SQL before execution."
    },
    {
      question: "Can I customize the visualizations?",
      answer: "Yes! Celabyte automatically chooses the best visualization for your data, but you can customize colors, labels, chart types, and create custom dashboards. Pro and Team plans include advanced visualization options."
    },
    {
      question: "What happens if I exceed my query limit?",
      answer: "You'll receive notifications as you approach your limit. If you exceed it, queries will be paused until the next billing cycle, or you can upgrade your plan instantly to continue with unlimited access."
    },
    {
      question: "Can I export my data and insights?",
      answer: "Yes, all plans include data export capabilities. You can export raw data as CSV/Excel, save visualizations as images, and share interactive dashboards with your team or stakeholders."
    },
    {
      question: "How long does setup take?",
      answer: "Most customers are up and running in under 5 minutes. Simply connect your database, and you can start asking questions immediately. Our team provides setup assistance for Enterprise customers."
    }
  ];

  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Frequently Asked <span className="text-gradient-accent">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get answers to the most common questions about Celabyte.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="gradient-card rounded-2xl surface-elevated border-0 px-8"
              >
                <AccordionTrigger className="text-left hover:text-primary transition-colors py-6">
                  <span className="text-lg font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a 
            href="#" 
            className="text-primary hover:underline font-semibold"
          >
            Contact our support team →
          </a>
        </div>
      </div>
    </section>
  );
};