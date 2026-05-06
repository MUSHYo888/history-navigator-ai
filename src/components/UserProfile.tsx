import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UserProfileProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userName">Name</Label>
          <Input id="userName" value={user.name} readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userEmail">Email</Label>
          <Input id="userEmail" value={user.email} readOnly />
        </div>
      </CardContent>
    </Card>
  );
};
