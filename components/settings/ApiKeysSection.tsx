"use client";

import { useCallback, useEffect, useState } from "react";

import { Eye, EyeOff, LoaderIcon, Save, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api/fetch";
import { KeysStatusSchema } from "@/types/api";


type KeysState = {
  openaiKey: string;
  anthropicKey: string;
  geminiKey: string;
  githubPat: string;
  leetcodePat: string;
};

type HasKeysState = {
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  hasGemini: boolean;
  hasGithubPat: boolean;
  hasLeetKey: boolean;
};

const EMPTY_KEYS: KeysState = {
  openaiKey: "",
  anthropicKey: "",
  geminiKey: "",
  githubPat: "",
  leetcodePat: "",
};

const EMPTY_HAS_KEYS: HasKeysState = {
  hasOpenAI: false,
  hasAnthropic: false,
  hasGemini: false,
  hasGithubPat: false,
  hasLeetKey: false,
};

export function ApiKeysSection() {
  const [keys, setKeys] = useState<KeysState>(EMPTY_KEYS);
  const [hasKeys, setHasKeys] = useState<HasKeysState>(EMPTY_HAS_KEYS);
  const [keysSaving, setKeysSaving] = useState(false);
  const [keysStatus, setKeysStatus] = useState("");
  const [showGithubPat, setShowGithubPat] = useState(false);

  // Load the saved key status so the UI can show what is already configured without revealing values.
  const loadKeys = useCallback(async () => {
    try {
      const data = await apiFetch("/api/profile/keys", KeysStatusSchema, {
        cache: "no-store",
      });
      setHasKeys({
        hasOpenAI: data.hasOpenAI,
        hasAnthropic: data.hasAnthropic,
        hasGemini: data.hasGemini,
        hasGithubPat: data.hasGithubPat,
        hasLeetKey: data.hasLeetKey,
      });
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  // Save only the fields the user touched so empty inputs do not wipe stored secrets.
  const saveKeys = async () => {
    setKeysSaving(true);
    setKeysStatus("");
    try {
      const payload: Partial<KeysState> = {};
      if (keys.openaiKey !== "") {payload.openaiKey = keys.openaiKey;}
      if (keys.anthropicKey !== "") {payload.anthropicKey = keys.anthropicKey;}
      if (keys.geminiKey !== "") {payload.geminiKey = keys.geminiKey;}
      if (keys.githubPat !== "") {payload.githubPat = keys.githubPat;}
      if (keys.leetcodePat !== "") {payload.leetcodePat = keys.leetcodePat;}

      if (Object.keys(payload).length === 0) {
        setKeysStatus("Enter a key to save");
        setKeysSaving(false);
        return;
      }

      const data = await apiFetch("/api/profile/keys", KeysStatusSchema, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      setHasKeys({
        hasOpenAI: data.hasOpenAI,
        hasAnthropic: data.hasAnthropic,
        hasGemini: data.hasGemini,
        hasGithubPat: data.hasGithubPat,
        hasLeetKey: data.hasLeetKey,
      });
      setKeys(EMPTY_KEYS);
      setKeysStatus("Keys saved successfully");
    } catch (error) {
      setKeysStatus(error instanceof Error ? error.message : "Could not save keys");
    } finally {
      setKeysSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="size-4" />
          API Keys & Integration
        </CardTitle>
        <CardDescription>
          Manage your API keys for AI providers and platform integrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI provider keys are grouped first because they power ClawMind and study generation. */}
        <div>
          <h3 className="font-semibold text-sm mb-3">AI Provider Keys</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                OpenAI Key{" "}
                {hasKeys.hasOpenAI && (
                  <span className="text-emerald-600 font-medium">(Saved)</span>
                )}
              </Label>
              <Input
                type="password"
                value={keys.openaiKey}
                onChange={(e) => setKeys((prev) => ({ ...prev, openaiKey: e.target.value }))}
                placeholder={hasKeys.hasOpenAI ? "••••••••" : "sk-..."}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Anthropic Key{" "}
                {hasKeys.hasAnthropic && (
                  <span className="text-emerald-600 font-medium">(Saved)</span>
                )}
              </Label>
              <Input
                type="password"
                value={keys.anthropicKey}
                onChange={(e) => setKeys((prev) => ({ ...prev, anthropicKey: e.target.value }))}
                placeholder={hasKeys.hasAnthropic ? "••••••••" : "sk-ant-..."}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Gemini Key{" "}
                {hasKeys.hasGemini && (
                  <span className="text-emerald-600 font-medium">(Saved)</span>
                )}
              </Label>
              <Input
                type="password"
                value={keys.geminiKey}
                onChange={(e) => setKeys((prev) => ({ ...prev, geminiKey: e.target.value }))}
                placeholder={hasKeys.hasGemini ? "••••••••" : "AIza..."}
                className="h-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Platform keys are shown separately because GitHub and LeetCode drive activity syncing. */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Platform Integration</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                GitHub PAT{" "}
                {hasKeys.hasGithubPat && (
                  <span className="text-emerald-600 font-medium">(Saved)</span>
                )}
              </Label>
              <p className="text-xs text-muted-foreground mb-1.5">
                Personal Access Token for full contribution history
              </p>
              <div className="relative">
                <Input
                  type={showGithubPat ? "text" : "password"}
                  value={keys.githubPat}
                  onChange={(e) => setKeys((prev) => ({ ...prev, githubPat: e.target.value }))}
                  placeholder={hasKeys.hasGithubPat ? "••••••••" : "ghp_..."}
                  className="h-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGithubPat(!showGithubPat)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showGithubPat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {keysStatus && (
          <p
            className={`text-xs ${
              keysStatus.includes("successfully")
                ? "text-emerald-600"
                : "text-muted-foreground"
            }`}
          >
            {keysStatus}
          </p>
        )}

        <Button onClick={saveKeys} disabled={keysSaving} className="gap-1.5 cursor-pointer">
          {keysSaving ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Keys
        </Button>
      </CardContent>
    </Card>
  );
}
