'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"

export function RandomContent() {
  const [showMore, setShowMore] = useState(false)
  
  return (
    <div className="space-y-8">
      <div className="saas-window mb-6">
        <div className="saas-window-header">
          <div className="saas-window-dot saas-window-dot-red"></div>
          <div className="saas-window-dot saas-window-dot-yellow"></div>
          <div className="saas-window-dot saas-window-dot-green"></div>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Дополнительный контент</h2>
          
          <div className="space-y-8">
            <Card className="p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-3">Последние исследования в области ИИ</h3>
              <p className="mb-4">
                Искусственный интеллект продолжает развиваться быстрыми темпами. Недавние исследования показывают значительный прогресс
                в области обработки естественного языка, компьютерного зрения и генеративных моделей.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Обработка естественного языка</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Новые модели демонстрируют улучшенное понимание контекста и способность генерировать более связные тексты.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Компьютерное зрение</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Алгоритмы распознавания изображений теперь могут идентифицировать объекты с точностью, превышающей человеческую.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">Подробнее</Button>
              </div>
            </Card>
            
            <Card className="p-6 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Популярные дискуссии</h3>
                <Badge>Горячие темы</Badge>
              </div>
              <div className="space-y-4 mb-4">
                <div className="border-b pb-3">
                  <div className="flex items-center mb-2">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>АП</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Алексей Петров</p>
                      <p className="text-xs text-gray-500">2 часа назад</p>
                    </div>
                  </div>
                  <p className="text-sm">
                    Как вы думаете, какие этические проблемы возникают при внедрении ИИ в повседневную жизнь?
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className="mr-4">👍 42</span>
                    <span>💬 18 комментариев</span>
                  </div>
                </div>
                <div className="border-b pb-3">
                  <div className="flex items-center mb-2">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>МС</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Мария Соколова</p>
                      <p className="text-xs text-gray-500">5 часов назад</p>
                    </div>
                  </div>
                  <p className="text-sm">
                    Поделитесь опытом использования нейросетей для генерации изображений. Какие инструменты предпочитаете?
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className="mr-4">👍 37</span>
                    <span>💬 24 комментария</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">Все дискуссии</Button>
              </div>
            </Card>
            
            {showMore && (
              <>
                <Card className="p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-3">Новости индустрии</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-md w-24 h-24 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium mb-1">OpenAI представила новую версию GPT-5</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Компания OpenAI анонсировала выпуск новой версии своей языковой модели с улучшенными возможностями.
                        </p>
                        <p className="text-xs text-gray-500">12 апреля 2025 • 5 мин. чтения</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-md w-24 h-24 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium mb-1">Google представил новый ИИ-чип для мобильных устройств</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Новый чип позволит запускать сложные ИИ-модели непосредственно на смартфонах без подключения к облаку.
                        </p>
                        <p className="text-xs text-gray-500">10 апреля 2025 • 3 мин. чтения</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-3">Обучающие материалы</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="border rounded-lg p-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-md w-full h-32 mb-3"></div>
                      <h4 className="font-medium mb-1">Введение в машинное обучение</h4>
                      <p className="text-xs text-gray-500 mb-2">Базовый курс • 12 уроков</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Изучите основы машинного обучения и нейронных сетей.
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-md w-full h-32 mb-3"></div>
                      <h4 className="font-medium mb-1">Глубокое обучение на практике</h4>
                      <p className="text-xs text-gray-500 mb-2">Продвинутый курс • 8 уроков</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Практические примеры применения глубокого обучения.
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-md w-full h-32 mb-3"></div>
                      <h4 className="font-medium mb-1">Разработка ИИ-приложений</h4>
                      <p className="text-xs text-gray-500 mb-2">Специализированный курс • 10 уроков</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Создайте собственное приложение с использованием ИИ.
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 shadow-md">
                  <h3 className="text-xl font-semibold mb-3">Предстоящие события</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start border-b pb-4">
                      <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 rounded-md w-16 h-16 flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-bold">15</span>
                        <span className="text-xs">Мая</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">AI Conference 2025</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Международная конференция по искусственному интеллекту с участием ведущих экспертов отрасли.
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="mr-4">🌐 Онлайн</span>
                          <span>⏰ 10:00 - 18:00</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-md w-16 h-16 flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-bold">22</span>
                        <span className="text-xs">Мая</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Воркшоп: Практическое применение GPT</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Практический семинар по использованию GPT-моделей для решения бизнес-задач.
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="mr-4">📍 Москва</span>
                          <span>⏰ 12:00 - 16:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
            
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? "Скрыть контент" : "Показать больше контента"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
