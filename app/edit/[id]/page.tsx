import { HeroHeader } from "@/components/header"
import { EditPostForm } from "@/components/edit-post-form"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id: postId } = await params

  return (
    <>
      <HeroHeader />
      <div className="container mx-auto w-[90%] pt-24 pb-8 px-4">
        <EditPostForm postId={postId} />
      </div>
    </>
  )
}

