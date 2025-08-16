import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Play, Code, MessageSquare, PieChart } from "lucide-react";

export const DemoSection = () => {
  const [activeMode, setActiveMode] = useState<"chat" | "sql">("chat");

  const chatMessages = [
    { type: "user", message: "Show me sales by region this month" },
    { type: "bot", message: "Here's your sales breakdown by region for this month:", hasChart: true },
    { type: "user", message: "Which region performed best?" },
    { type: "bot", message: "The West region had the highest sales with $2.4M (32% growth vs last month)" },
  ];

  const sqlExample = `-- Generated automatically from: "Show me sales by region this month"

SELECT 
  r.region_name,
  SUM(s.amount) as total_sales,
  COUNT(s.id) as transaction_count,
  AVG(s.amount) as avg_order_value
FROM sales s
JOIN customers c ON s.customer_id = c.id
JOIN regions r ON c.region_id = r.id
WHERE s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY r.region_name
ORDER BY total_sales DESC;`;

  return (
    <section id="demo" className="py-24 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            See It In <span className="text-gradient-accent">Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the power of conversational data analysis. Switch between chat and SQL views.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-background rounded-xl p-2 flex gap-2">
              <Button
                variant={activeMode === "chat" ? "hero" : "ghost"}
                onClick={() => setActiveMode("chat")}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat Mode
              </Button>
              <Button
                variant={activeMode === "sql" ? "hero" : "ghost"}
                onClick={() => setActiveMode("sql")}
                className="flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                SQL Mode
              </Button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="gradient-card rounded-2xl surface-elevated overflow-hidden">
            {activeMode === "chat" ? (
              <div className="p-8">
                <div className="space-y-6">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="flex justify-start">
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        msg.type === "user" 
                          ? "bg-primary text-white ml-auto" 
                          : "bg-muted text-foreground"
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        {msg.hasChart && (
                          <div className="mt-4 bg-background/10 rounded-lg p-4">
                            <div className="h-32 bg-primary/20 rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <PieChart className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <p className="text-xs text-muted-foreground">Interactive Chart</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Ask anything about your data..."
                      className="flex-1 bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled
                    />
                    <Button variant="hero" className="px-6">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="bg-background rounded-lg p-6 font-mono text-sm">
                  <pre className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {sqlExample}
                  </pre>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Query generated in 0.3s • Executed in 0.1s
                  </div>
                  <Button variant="outline" size="sm">
                    Copy SQL
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};