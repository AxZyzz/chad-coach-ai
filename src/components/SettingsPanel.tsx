import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { UserProfile } from "./OnboardingFlow";
import { supabase } from "@/lib/supabase";

interface SettingsPanelProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

export const SettingsPanel = ({
  profile,
  onUpdateProfile,
  onClose,
}: SettingsPanelProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-8 shadow-elegant">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
            >
              Logout
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="space-y-8">
          {/* Tone Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">Motivation Tone</Label>
            <RadioGroup
              value={profile.ai_tone}
              onValueChange={(value) =>
                onUpdateProfile({
                  ...profile,
                  ai_tone: value as "tough" | "stoic" | "bro",
                })
              }
              className="space-y-3"
            >
              <Label
                htmlFor="settings-tough"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border border-border bg-secondary/30 p-3 hover:bg-secondary/50 transition-colors"
              >
                <RadioGroupItem value="tough" id="settings-tough" />
                <span className="text-sm font-medium text-foreground">Tough Coach</span>
              </Label>

              <Label
                htmlFor="settings-stoic"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border border-border bg-secondary/30 p-3 hover:bg-secondary/50 transition-colors"
              >
                <RadioGroupItem value="stoic" id="settings-stoic" />
                <span className="text-sm font-medium text-foreground">Stoic Mentor</span>
              </Label>

              <Label
                htmlFor="settings-bro"
                className="flex cursor-pointer items-center space-x-3 rounded-lg border border-border bg-secondary/30 p-3 hover:bg-secondary/50 transition-colors"
              >
                <RadioGroupItem value="bro" id="settings-bro" />
                <span className="text-sm font-medium text-foreground">Big Bro Energy</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Intensity */}
          <div className="space-y-3">
            <Label className="text-foreground">Intensity Level</Label>
            <div className="space-y-4">
              <Slider
                value={[profile.ai_intensity]}
                onValueChange={(value) => 
                  onUpdateProfile({ ...profile, ai_intensity: value[0] })
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

          {/* Focus Area */}
          <div className="space-y-3">
            <Label className="text-foreground">Focus Area</Label>
            <RadioGroup
              value={profile.focusArea}
              onValueChange={(value) =>
                onUpdateProfile({ ...profile, focusArea: value })
              }
              className="grid grid-cols-2 gap-3"
            >
              {["Fitness", "Career", "Productivity", "Mindset", "Habits"].map(
                (area) => (
                  <Label
                    key={area}
                    htmlFor={`settings-${area.toLowerCase()}`}
                    className="flex cursor-pointer items-center space-x-3 rounded-lg border border-border bg-secondary/30 p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <RadioGroupItem
                      value={area.toLowerCase()}
                      id={`settings-${area.toLowerCase()}`}
                    />
                    <span className="text-sm font-medium text-foreground">{area}</span>
                  </Label>
                )
              )}
            </RadioGroup>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end">
          <Button onClick={onClose}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};
