import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Play, Code, MessageSquare, PieChart, Copy } from "lucide-react";

export const DemoSection = () => {
  const [activeMode, setActiveMode] = useState<"chat" | "sql">("chat");

  const chatExample = {
    query: "Show me sales by region this month",
    response: "Here's your sales breakdown by region for this month:",
    data: [
      { region: "North", sales: "$124K", color: "google-blue" },
      { region: "South", sales: "$98K", color: "google-green" },
      { region: "East", sales: "$156K", color: "google-yellow" },
      { region: "West", sales: "$87K", color: "google-red" }
    ]
  };

  const sqlExample = `-- Auto-generated from: "Show me sales by region this month"

SELECT 
  r.region_name,
  SUM(s.amount) as total_sales,
  COUNT(s.id) as transaction_count
FROM sales s
JOIN customers c ON s.customer_id = c.id
JOIN regions r ON c.region_id = r.id
WHERE s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY r.region_name
ORDER BY total_sales DESC;`;

  return (
    <section id="demo" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Large product screenshot showing the split view between natural language and auto-generated SQL.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-surface rounded-xl p-2 flex gap-2 shadow-card border">
              <Button
                variant={activeMode === "chat" ? "default" : "ghost"}
                onClick={() => setActiveMode("chat")}
                className={`flex items-center gap-2 ${activeMode === "chat" ? "bg-google-blue text-white" : ""}`}
              >
                <MessageSquare className="w-4 h-4" />
                Ask in Plain English
              </Button>
              <Button
                variant={activeMode === "sql" ? "default" : "ghost"}
                onClick={() => setActiveMode("sql")}
                className={`flex items-center gap-2 ${activeMode === "sql" ? "bg-google-blue text-white" : ""}`}
              >
                <Code className="w-4 h-4" />
                Auto-Generated SQL
              </Button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="bg-white rounded-2xl shadow-elevated overflow-hidden border">
            {activeMode === "chat" ? (
              <div className="p-8">
                <div className="space-y-6">
                  <div className="bg-surface rounded-lg p-4 border-l-4 border-l-google-blue">
                    <div className="text-sm text-muted-foreground mb-1">You asked:</div>
                    <div className="font-medium text-lg">"{chatExample.query}"</div>
                  </div>
                  
                  <div className="bg-gradient-card rounded-lg p-6 shadow-card">
                    <div className="text-sm text-muted-foreground mb-4">{chatExample.response}</div>
                    <div className="grid grid-cols-2 gap-4">
                      {chatExample.data.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-card border">
                          <span className="font-medium">{item.region}:</span>
                          <span className={`font-bold ${item.color}`}>{item.sales}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-4 bg-white/50 rounded-lg border">
                      <div className="flex items-center justify-center space-x-2">
                        <PieChart className="w-6 h-6 google-blue" />
                        <span className="text-sm text-muted-foreground">Interactive Chart Generated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="bg-surface rounded-lg p-6 font-mono text-sm border">
                  <pre className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {sqlExample}
                  </pre>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="google-green">✓</span> Query generated in 0.3s • Executed in 0.1s
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
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