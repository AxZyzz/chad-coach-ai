import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

export type UserProfile = {
  username?: string;
  ai_goal: string;
  ai_tone: "tough" | "stoic" | "bro";
  ai_intensity: number;
  updated_at?: string;
};

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    ai_goal: "",
    ai_tone: "tough",
    ai_intensity: 70,
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profile.username?.trim().length ?? 0 > 0;
      case 2:
        return profile.ai_goal.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-border bg-card p-8 shadow-elegant">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
            <span className="text-2xl font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Welcome to CHADGPT
          </h1>
          <p className="text-muted-foreground">
            Not your therapist. Your wake-up call.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 mx-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {step} of 4
          </p>
        </div>

        {/* Step Content */}
        <div className="mb-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  What should I call you?
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Enter your name or what you'd like to be called
                </p>
                <Input
                  placeholder="Enter your name..."
                  value={profile.username || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, username: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  What are your goals?
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Be specific. Fitness? Career? Studies? Habits?
                </p>
                <Textarea
                  placeholder="E.g., Get in shape, build my business, stop procrastinating..."
                  value={profile.ai_goal}
                  onChange={(e) =>
                    setProfile({ ...profile, ai_goal: e.target.value })
                  }
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Choose your motivation tone
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  How should I push you, {profile.username}?
                </p>
                <RadioGroup
                  value={profile.ai_tone}
                  onValueChange={(value) =>
                    setProfile({
                      ...profile,
                      ai_tone: value as "tough" | "stoic" | "bro",
                    })
                  }
                  className="space-y-4"
                >
                  <Label
                    htmlFor="tough"
                    className="flex cursor-pointer items-start space-x-3 rounded-lg border border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <RadioGroupItem value="tough" id="tough" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Tough Coach</p>
                      <p className="text-sm text-muted-foreground">
                        Hard facts, direct commands. No excuses.
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="stoic"
                    className="flex cursor-pointer items-start space-x-3 rounded-lg border border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <RadioGroupItem value="stoic" id="stoic" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Stoic Mentor</p>
                      <p className="text-sm text-muted-foreground">
                        Philosophical realism, minimal sugar coating.
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="bro"
                    className="flex cursor-pointer items-start space-x-3 rounded-lg border border-border bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <RadioGroupItem value="bro" id="bro" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Big Bro Energy</p>
                      <p className="text-sm text-muted-foreground">
                        Teasing but supportive. Keeps it real.
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Set your intensity level
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  How hard should I push you, {profile.username}?
                </p>
                <div className="space-y-4">
                  <Slider
                    value={[profile.ai_intensity]}
                    onValueChange={([value]) =>
                      setProfile({ ...profile, ai_intensity: value })
                    }
                    min={0}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gentle</span>
                    <span className="font-semibold text-primary">
                      {profile.ai_intensity}%
                    </span>
                    <span className="text-muted-foreground">Savage</span>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            {step === 3 ? "Get Started" : "Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Textarea component if not already created
const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};
