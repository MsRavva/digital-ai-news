"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const StyleGuidePage = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Style Guide</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm mr-2">Тема:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Светлая
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Темная
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Кнопки */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Кнопки</CardTitle>
          <CardDescription>Различные варианты кнопок</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
          <Button 
            className="bg-[hsl(var(--saas-purple))] text-white hover:bg-[hsl(var(--saas-purple-dark))]"
          >
            Default
          </Button>
          <Button 
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Destructive
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button 
            className="text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] underline"
          >
            Link
          </Button>
          <Button 
            className="bg-[hsl(var(--saas-purple))] text-white hover:bg-[hsl(var(--saas-purple-dark))]"
          >
            Purple
          </Button>
          <Button 
            size="sm"
            className="bg-[hsl(var(--saas-purple))] text-white hover:bg-[hsl(var(--saas-purple-dark))]"
          >
            Small
          </Button>
          <Button 
            size="lg"
            className="bg-[hsl(var(--saas-purple))] text-white hover:bg-[hsl(var(--saas-purple-dark))]"
          >
            Large
          </Button>
          <Button 
            disabled
            className="bg-[hsl(var(--saas-purple))] text-white hover:bg-[hsl(var(--saas-purple-dark))]"
          >
            Disabled
          </Button>
        </CardContent>
      </Card>
      
      <Separator className="my-8" />
      
      {/* Бейджи */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Бейджи</CardTitle>
          <CardDescription>Различные варианты бейджей</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <Badge 
            className="bg-[hsl(var(--saas-purple))] text-white"
          >
            Default
          </Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge 
            className="text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.3)] dark:border-[hsl(var(--saas-purple)/0.5)] shadow-sm dark:shadow-[hsl(var(--saas-purple)/0.2)] bg-white dark:bg-[hsl(var(--saas-purple)/0.1)]"
          >
            Purple
          </Badge>
        </CardContent>
      </Card>
      
      <Separator className="my-8" />
      
      {/* Аватары */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Аватары</CardTitle>
          <CardDescription>Различные варианты аватаров</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="h-16 w-16">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </CardContent>
      </Card>
      
      <Separator className="my-8" />
      
      {/* Цвета */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Цвета</CardTitle>
          <CardDescription>Основные цвета, используемые в проекте</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-primary mb-2"></div>
              <span className="text-sm">Primary</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-primary-foreground mb-2"></div>
              <span className="text-sm text-white">Primary Foreground</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-secondary mb-2"></div>
              <span className="text-sm">Secondary</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-secondary-foreground mb-2"></div>
              <span className="text-sm">Secondary Foreground</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-destructive mb-2"></div>
              <span className="text-sm text-white">Destructive</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-destructive-foreground mb-2"></div>
              <span className="text-sm text-white">Destructive Foreground</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-muted mb-2"></div>
              <span className="text-sm">Muted</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-muted-foreground mb-2"></div>
              <span className="text-sm">Muted Foreground</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-accent mb-2"></div>
              <span className="text-sm">Accent</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-accent-foreground mb-2"></div>
              <span className="text-sm">Accent Foreground</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-card mb-2"></div>
              <span className="text-sm">Card</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-card-foreground mb-2"></div>
              <span className="text-sm">Card Foreground</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-popover mb-2"></div>
              <span className="text-sm">Popover</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-popover-foreground mb-2"></div>
              <span className="text-sm">Popover Foreground</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-border mb-2"></div>
              <span className="text-sm">Border</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-md bg-input mb-2"></div>
              <span className="text-sm">Input</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Separator className="my-8" />
      
      {/* Дополнительные цвета */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Дополнительные цвета</CardTitle>
          <CardDescription>Специализированные цвета проекта</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-md mb-2" 
                style={{ backgroundColor: "hsl(var(--saas-purple))" }}
              ></div>
              <span className="text-sm text-center">Фиолетовый<br/>(saas-purple)</span>
            </div>
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-md mb-2" 
                style={{ backgroundColor: "hsl(var(--saas-green))" }}
              ></div>
              <span className="text-sm text-center">Зеленый<br/>(saas-green)<br/>Восстановление</span>
            </div>
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-md mb-2" 
                style={{ backgroundColor: "#f97316" }} // orange-500
              ></div>
              <span className="text-sm text-center">Оранжевый<br/>(orange-500)<br/>Архив</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Separator className="my-8" />
      
      {/* Цвета архива и восстановления */}
      <Card>
        <CardHeader>
          <CardTitle>Цвета архива и восстановления</CardTitle>
          <CardDescription>Специальные цвета для операций с архивом</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg border">
              <div className="text-orange-500 dark:text-orange-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 12v.01" />
                  <path d="M10 16v.01" />
                  <path d="M10 8v.01" />
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </svg>
              </div>
              <span className="text-sm font-medium mb-1">Архив</span>
              <span className="text-xs text-muted-foreground">text-orange-500</span>
              <span className="text-xs text-muted-foreground">(темная тема: text-orange-400)</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border">
              <div className="text-green-600 dark:text-green-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              </div>
              <span className="text-sm font-medium mb-1">Восстановление</span>
              <span className="text-xs text-muted-foreground">text-green-600</span>
              <span className="text-xs text-muted-foreground">(темная тема: text-green-400)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StyleGuidePage;