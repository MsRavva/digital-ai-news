'use client'

import { useState } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Bell, Lock, User, Shield, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newComments: true,
    newLikes: true,
    newFollowers: true,
    newsletter: false
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Проверка паролей
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Новые пароли не совпадают",
        variant: "destructive",
      })
      return
    }
    
    // Здесь должна быть логика изменения пароля
    // В данном примере просто показываем уведомление об успехе
    toast({
      title: "Пароль изменен",
      description: "Ваш пароль был успешно изменен",
    })
    
    // Очищаем форму
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Здесь должна быть логика сохранения настроек уведомлений
    // В данном примере просто показываем уведомление об успехе
    toast({
      title: "Настройки сохранены",
      description: "Ваши настройки уведомлений были успешно сохранены",
    })
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Пожалуйста, войдите в систему для доступа к настройкам</p>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Настройки</h1>
          
          <Tabs defaultValue="account" className="w-full">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-64 flex-shrink-0">
                <TabsList className="flex flex-col w-full h-auto bg-transparent space-y-1">
                  <TabsTrigger value="account" className="w-full justify-start px-3 py-2 h-auto">
                    <User className="h-4 w-4 mr-2" />
                    Аккаунт
                  </TabsTrigger>
                  <TabsTrigger value="security" className="w-full justify-start px-3 py-2 h-auto">
                    <Lock className="h-4 w-4 mr-2" />
                    Безопасность
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="w-full justify-start px-3 py-2 h-auto">
                    <Bell className="h-4 w-4 mr-2" />
                    Уведомления
                  </TabsTrigger>
                  {profile.role === "admin" && (
                    <TabsTrigger value="admin" className="w-full justify-start px-3 py-2 h-auto">
                      <Shield className="h-4 w-4 mr-2" />
                      Администрирование
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
              
              <div className="flex-1">
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle>Информация об аккаунте</CardTitle>
                      <CardDescription>
                        Просмотр и управление информацией о вашем аккаунте
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <span>{user.email}</span>
                          <Badge variant={user.emailVerified ? "success" : "destructive"}>
                            {user.emailVerified ? "Подтвержден" : "Не подтвержден"}
                          </Badge>
                        </div>
                        {!user.emailVerified && (
                          <Button variant="link" className="text-[hsl(var(--saas-purple))] p-0 h-auto">
                            Отправить письмо для подтверждения
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Имя пользователя</Label>
                        <div className="p-3 border rounded-md">
                          {profile.username}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Роль</Label>
                        <div className="p-3 border rounded-md">
                          {profile.role === "teacher" ? "Учитель" : profile.role === "admin" ? "Администратор" : "Ученик"}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Дата регистрации</Label>
                        <div className="p-3 border rounded-md">
                          {new Date(profile.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Link href="/profile">Перейти к профилю</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Безопасность</CardTitle>
                      <CardDescription>
                        Управление паролем и настройками безопасности
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Текущий пароль</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Новый пароль</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
                        >
                          Изменить пароль
                        </Button>
                      </form>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Сеансы</h3>
                        <div className="p-4 border rounded-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Текущий сеанс</p>
                              <p className="text-sm text-muted-foreground">Последняя активность: {new Date().toLocaleString("ru-RU")}</p>
                            </div>
                            <Badge>Активен</Badge>
                          </div>
                        </div>
                        
                        <Button variant="outline" className="w-full">
                          Выйти из всех сеансов
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Уведомления</CardTitle>
                      <CardDescription>
                        Настройте, какие уведомления вы хотите получать
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleNotificationSubmit} className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Email-уведомления</Label>
                              <p className="text-sm text-muted-foreground">
                                Получать уведомления по электронной почте
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.emailNotifications}
                              onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Новые комментарии</Label>
                              <p className="text-sm text-muted-foreground">
                                Уведомления о новых комментариях к вашим публикациям
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.newComments}
                              onCheckedChange={(checked) => handleNotificationChange('newComments', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Новые лайки</Label>
                              <p className="text-sm text-muted-foreground">
                                Уведомления о новых лайках к вашим публикациям
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.newLikes}
                              onCheckedChange={(checked) => handleNotificationChange('newLikes', checked)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Новые подписчики</Label>
                              <p className="text-sm text-muted-foreground">
                                Уведомления о новых подписчиках
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.newFollowers}
                              onCheckedChange={(checked) => handleNotificationChange('newFollowers', checked)}
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Рассылка новостей</Label>
                              <p className="text-sm text-muted-foreground">
                                Получать еженедельную рассылку с новостями и обновлениями
                              </p>
                            </div>
                            <Switch
                              checked={notificationSettings.newsletter}
                              onCheckedChange={(checked) => handleNotificationChange('newsletter', checked)}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
                        >
                          Сохранить настройки
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {profile.role === "admin" && (
                  <TabsContent value="admin">
                    <Card>
                      <CardHeader>
                        <CardTitle>Администрирование</CardTitle>
                        <CardDescription>
                          Управление сайтом и пользователями (доступно только администраторам)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Внимание</AlertTitle>
                          <AlertDescription>
                            Эта секция доступна только администраторам. Будьте осторожны при внесении изменений.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-4">
                          <Button className="w-full">Управление пользователями</Button>
                          <Button className="w-full">Управление публикациями</Button>
                          <Button className="w-full">Настройки сайта</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
