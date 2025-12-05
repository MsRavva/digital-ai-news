import { CreatePostForm } from "@/components/create-post-form";
import { HeroHeader } from "@/components/header";

export default function CreatePostPage() {
  return (
    <>
      <HeroHeader />
      <div className="container mx-auto w-[90%] pt-24 pb-8 px-4">
        <CreatePostForm />
      </div>
    </>
  );
}
