'use client'

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getPosts } from "@/lib/client-api"
import { Post } from "@/types/database"
import Link from "next/link"
import { MessageSquare, ThumbsUp, Eye, Github, Globe, MapPin, Pencil, Save } from "lucide-react"

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    vk: ''
  })
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        github: profile.social?.github || '',
        vk: profile.social?.vk || ''
      })
    }
  }, [profile])

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (user) {
        try {
          const posts = await getPosts()
          // Фильтруем посты текущего пользователя (в реальном приложении это должно делаться на сервере)
          const filteredPosts = posts.filter(post => post.author?.username === profile?.username)
          setUserPosts(filteredPosts)
          setStats({
            posts: filteredPosts.length,
            comments: filteredPosts.reduce((acc, post) => acc + (post.commentsCount || 0), 0),
            likes: filteredPosts.reduce((acc, post) => acc + (post.likesCount || 0), 0)
          })
        } catch (error) {
          console.error('Ошибка при загрузке публикаций пользователя:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserPosts()
  }, [user, profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) return

    try {
      const updatedProfile = {
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        social: {
          github: formData.github,
          vk: formData.vk
        }
      }

      const { success, error } = await updateProfile(updatedProfile)

      if (success) {
        toast({
          title: "Профиль обновлен",
          description: "Ваш профиль был успешно обновлен",
        })
        setIsEditing(false)
      } else {
        toast({
          title: "Ошибка",
          description: error?.message || "Не удалось обновить профиль",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при обновлении профиля",
        variant: "destructive",
      })
    }
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
              <p className="text-muted-foreground">Пожалуйста, войдите в систему для просмотра профиля</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Профиль пользователя */}
            <div className="md:col-span-1">
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>Профиль</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-[hsl(var(--saas-purple))]"
                    >
                      {isEditing ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Сохранить
                        </>
                      ) : (
                        <>
                          <Pencil className="h-4 w-4 mr-2" />
                          Редактировать
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex flex-col items-center">
                    <SimpleAvatar username={profile.username} size="xl" className="h-24 w-24 text-2xl mb-4" />
                    <h2 className="text-2xl font-bold">{profile.username}</h2>
                    <Badge variant="outline" className="mt-1 mb-2">
                      {profile.role === "teacher" ? "Учитель" : profile.role === "admin" ? "Администратор" : "Ученик"}
                    </Badge>
                    <p className="text-muted-foreground">{user.email}</p>

                    {!isEditing && (
                      <div className="mt-4 text-left w-full">
                        {profile.bio && (
                          <div className="mb-4">
                            <p>{profile.bio}</p>
                          </div>
                        )}

                        {(profile.location || profile.website || profile.social) && (
                          <div className="space-y-2 mt-4">
                            {profile.location && (
                              <div className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{profile.location}</span>
                              </div>
                            )}

                            {profile.website && (
                              <div className="flex items-center text-sm">
                                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                                <a
                                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[hsl(var(--saas-purple))] hover:underline"
                                >
                                  {profile.website}
                                </a>
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                              {profile.social?.github && (
                                <a
                                  href={`https://github.com/${profile.social.github}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-[hsl(var(--saas-purple))]"
                                >
                                  <Github className="h-5 w-5" />
                                </a>
                              )}

                              {profile.social?.vk && (
                                <a
                                  href={`https://vk.com/${profile.social.vk}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-[hsl(var(--saas-purple))]"
                                >
                                  <img src="/vk.svg" alt="VK" className="h-5 w-5" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <form onSubmit={handleSubmit} className="w-full mt-4 text-left">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="username">Имя пользователя</Label>
                            <Input
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="bio">О себе</Label>
                            <Textarea
                              id="bio"
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              className="mt-1"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor="location">Местоположение</Label>
                            <Input
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="website">Веб-сайт</Label>
                            <Input
                              id="website"
                              name="website"
                              value={formData.website}
                              onChange={handleInputChange}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Социальные сети</Label>
                            <div className="space-y-2 mt-1">
                              <div className="flex items-center">
                                <Github className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                  id="github"
                                  name="github"
                                  value={formData.github}
                                  onChange={handleInputChange}
                                  placeholder="username"
                                />
                              </div>

                              <div className="flex items-center">
                                <img src="/vk.svg" alt="VK" className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                  id="vk"
                                  name="vk"
                                  value={formData.vk}
                                  onChange={handleInputChange}
                                  placeholder="username"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
                            >
                              Сохранить изменения
                            </Button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[hsl(var(--saas-purple))]">{stats.posts}</p>
                      <p className="text-sm text-muted-foreground">Публикаций</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[hsl(var(--saas-purple))]">{stats.comments}</p>
                      <p className="text-sm text-muted-foreground">Комментариев</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[hsl(var(--saas-purple))]">{stats.likes}</p>
                      <p className="text-sm text-muted-foreground">Лайков</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Публикации пользователя */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Мои публикации</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">Загрузка публикаций...</p>
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">У вас пока нет публикаций</p>
                      <Button className="mt-4 bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white">
                        <Link href="/create">Создать публикацию</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userPosts.map((post) => (
                        <div key={post.id} className="border rounded-lg p-4 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200">
                          <Link href={`/posts/${post.id}`}>
                            <h3 className="text-xl font-semibold mb-2 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                              {post.title}
                            </h3>
                          </Link>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags?.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="mr-4">{new Date(post.created_at).toLocaleDateString("ru-RU")}</span>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.commentsCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{post.likesCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{post.viewsCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
