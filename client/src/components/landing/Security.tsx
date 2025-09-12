import { Shield, Lock, Eye, Award } from "lucide-react";

export const Security = () => {
  const certifications = [
    {
      icon: Award,
      title: "SOC 2 Type II",
      description: "Audited security controls and compliance"
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "European data protection standards"
    },
    {
      icon: Lock,
      title: "HIPAA Ready",
      description: "Healthcare data protection certified"
    },
    {
      icon: Eye,
      title: "ISO 27001",
      description: "Information security management"
    }
  ];

  return (
    <section className="py-24 bg-surface">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="w-20 h-20 mx-auto gradient-accent rounded-2xl flex items-center justify-center mb-6 glow-accent">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Enterprise-Grade <span className="text-gradient-accent">Security</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your data security is our top priority. Built with industry-leading security standards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {certifications.map((cert, index) => (
            <div 
              key={index} 
              className="text-center gradient-card p-8 rounded-2xl surface-elevated group hover:scale-105 transition-all-smooth"
            >
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <cert.icon className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                {cert.title}
              </h3>
              
              <p className="text-muted-foreground text-sm leading-relaxed">
                {cert.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="gradient-card p-8 rounded-2xl surface-elevated max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6">Additional Security Features</h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>End-to-end encryption in transit and at rest</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Role-based access controls (RBAC)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Multi-factor authentication (MFA)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Audit logs and activity monitoring</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>VPC and private cloud deployments</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Regular security testing and assessments</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Data residency and localization options</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>24/7 security operations center (SOC)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};