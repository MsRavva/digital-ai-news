import { HeroHeader } from "@/components/header"
import { CreatePostForm } from "@/components/create-post-form"

export default function CreatePostPage() {
  return (
    <>
      <HeroHeader />
      <div className="container mx-auto w-[60%] pt-24 pb-8 px-4">
        <CreatePostForm />
      </div>
    </>
  )
}

