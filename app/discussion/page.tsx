"use client";

import { useState } from "react";
import { MessageSquare, Users, Trophy, ThumbsUp, MessageCircle, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function DiscussionPage() {
    const [newPost, setNewPost] = useState("");

    const squads = [
        { id: 1, name: "Code Warriors", score: 2450, members: 12, rank: 1, color: "bg-yellow-500" },
        { id: 2, name: "Tech Titans", score: 2380, members: 15, rank: 2, color: "bg-gray-400" },
        { id: 3, name: "Dev Dynamos", score: 2290, members: 10, rank: 3, color: "bg-orange-500" },
        { id: 4, name: "Byte Busters", score: 2150, members: 14, rank: 4, color: "bg-blue-500" },
        { id: 5, name: "Logic Lords", score: 2050, members: 11, rank: 5, color: "bg-purple-500" },
    ];

    const discussions = [
        {
            id: 1,
            author: "Sarah Chen",
            authorInitials: "SC",
            squad: "Code Warriors",
            title: "How to optimize React renders?",
            content: "I'm working on a large dashboard and noticing performance issues. What are the best practices for optimizing React re-renders?",
            category: "Question",
            likes: 24,
            replies: 12,
            timeAgo: "2 hours ago",
        },
        {
            id: 2,
            author: "Mike Johnson",
            authorInitials: "MJ",
            squad: "Tech Titans",
            title: "Solved: Dynamic Programming Pattern",
            content: "Just cracked the longest palindromic subsequence problem! Happy to share my approach if anyone's stuck on similar DP problems.",
            category: "Achievement",
            likes: 45,
            replies: 8,
            timeAgo: "4 hours ago",
        },
        {
            id: 3,
            author: "Emma Davis",
            authorInitials: "ED",
            squad: "Dev Dynamos",
            title: "Study group for system design?",
            content: "Looking to form a study group for preparing system design interviews. Anyone interested in joining weekly sessions?",
            category: "Collaboration",
            likes: 18,
            replies: 15,
            timeAgo: "6 hours ago",
        },
        {
            id: 4,
            author: "Alex Kumar",
            authorInitials: "AK",
            squad: "Byte Busters",
            title: "Help with async/await in JavaScript",
            content: "I'm confused about promise chaining vs async/await. Can someone explain when to use each approach?",
            category: "Question",
            likes: 32,
            replies: 20,
            timeAgo: "1 day ago",
        },
    ];

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Question": return "bg-blue-100 text-blue-700";
            case "Achievement": return "bg-green-100 text-green-700";
            case "Collaboration": return "bg-purple-100 text-purple-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Discussion</h1>
                <p className="text-gray-600 mt-1">Connect with your squad and share ideas</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <Tabs defaultValue="forum" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="forum">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Forum
                            </TabsTrigger>
                            <TabsTrigger value="squads">
                                <Users className="w-4 h-4 mr-2" />
                                Squads
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="forum" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Start a Discussion</CardTitle>
                                    <CardDescription>Ask questions, share achievements, or collaborate with peers</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Input placeholder="Title of your post..." className="w-full" />
                                        <Textarea
                                            placeholder="Share your thoughts, questions, or ideas..."
                                            value={newPost}
                                            onChange={(e) => setNewPost(e.target.value)}
                                            className="min-h-[100px]"
                                        />
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">Question</Badge>
                                                <Badge variant="outline" className="cursor-pointer hover:bg-green-50">Achievement</Badge>
                                                <Badge variant="outline" className="cursor-pointer hover:bg-purple-50">Collaboration</Badge>
                                            </div>
                                            <Button className="bg-blue-600 hover:bg-blue-700">
                                                <Send className="w-4 h-4 mr-2" />
                                                Post
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input placeholder="Search discussions..." className="pl-10" />
                                </div>
                                <Button variant="outline">Filter</Button>
                            </div>

                            <div className="space-y-3">
                                {discussions.map((discussion) => (
                                    <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardContent className="pt-6">
                                            <div className="flex gap-4">
                                                <Avatar>
                                                    <AvatarFallback className="bg-blue-600 text-white">
                                                        {discussion.authorInitials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 mb-1">{discussion.title}</h3>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <span className="font-medium">{discussion.author}</span>
                                                                <span>•</span>
                                                                <span>{discussion.squad}</span>
                                                                <span>•</span>
                                                                <span>{discussion.timeAgo}</span>
                                                            </div>
                                                        </div>
                                                        <Badge className={getCategoryColor(discussion.category)}>
                                                            {discussion.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-gray-700 mb-3">{discussion.content}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                                            <ThumbsUp className="w-4 h-4" />
                                                            <span>{discussion.likes}</span>
                                                        </button>
                                                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span>{discussion.replies} replies</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="squads" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Squad Leaderboard</CardTitle>
                                    <CardDescription>Compete with other squads and climb the rankings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {squads.map((squad) => (
                                            <div
                                                key={squad.id}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 ${squad.color} rounded-full flex items-center justify-center text-white font-bold`}>
                                                        #{squad.rank}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{squad.name}</h3>
                                                        <p className="text-sm text-gray-600">{squad.members} members</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-blue-600">{squad.score.toLocaleString()}</div>
                                                        <div className="text-xs text-gray-600">points</div>
                                                    </div>
                                                    {squad.rank <= 3 && (
                                                        <Trophy className={`w-6 h-6 ${squad.rank === 1 ? 'text-yellow-500' : squad.rank === 2 ? 'text-gray-400' : 'text-orange-500'}`} />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Squad</CardTitle>
                                    <CardDescription>Code Warriors</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Current Rank</span>
                                            <span className="text-2xl font-bold text-blue-600">#1</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Squad Score</span>
                                            <span className="text-2xl font-bold text-gray-900">2,450</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Members</span>
                                            <span className="text-lg font-semibold text-gray-900">12</span>
                                        </div>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                            <Users className="w-4 h-4 mr-2" />
                                            View Squad Members
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Top Squads
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {squads.slice(0, 3).map((squad) => (
                                    <div key={squad.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 ${squad.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                                                {squad.rank}
                                            </div>
                                            <span className="font-medium text-gray-900">{squad.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-blue-600">{squad.score}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active Topics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Badge variant="secondary" className="mr-2 mb-2">React Optimization</Badge>
                                <Badge variant="secondary" className="mr-2 mb-2">System Design</Badge>
                                <Badge variant="secondary" className="mr-2 mb-2">Algorithms</Badge>
                                <Badge variant="secondary" className="mr-2 mb-2">Interview Prep</Badge>
                                <Badge variant="secondary" className="mr-2 mb-2">JavaScript</Badge>
                                <Badge variant="secondary" className="mr-2 mb-2">Data Structures</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Discussion Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Posts</span>
                                    <span className="font-semibold">247</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Active Today</span>
                                    <span className="font-semibold">42</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Your Posts</span>
                                    <span className="font-semibold text-blue-600">8</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
