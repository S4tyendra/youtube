"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AuthCheckDialogProps {
  onAuthSuccess: () => void;
}

export function AuthCheckDialog({ onAuthSuccess }: AuthCheckDialogProps) {
  const [userId, setUserId] = useState("");
  const [cookies, setCookies] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUserIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate if the user ID exists by making a test request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed?page=1`, {
        headers: {
          login: userId
        }
      });

      if (response.ok) {
        localStorage.setItem("youtube_user_id", userId);
        onAuthSuccess();
      } else {
        setError("Invalid user ID");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to validate user ID";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCookiesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/set-cookies`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: cookies
      });

      if (!response.ok) {
        throw new Error("Failed to set cookies");
      }

      const data = await response.json();
      localStorage.setItem("youtube_user_id", data.user_id);
      onAuthSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to set cookies";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="userid" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="userid">User ID</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>
          <TabsContent value="userid">
            <form onSubmit={handleUserIdSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userid">User ID</Label>
                <Input
                  id="userid"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Validating..." : "Submit"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="cookies">
            <form onSubmit={handleCookiesSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cookies">Netscape Format Cookies</Label>
                <Textarea
                  id="cookies"
                  value={cookies}
                  onChange={(e) => setCookies(e.target.value)}
                  placeholder="Paste your Netscape format cookies here"
                  className="h-[200px]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}