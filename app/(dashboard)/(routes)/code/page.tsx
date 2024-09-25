"use client";

import * as z from "zod";
import { Code, Copy } from "lucide-react"; // Import the Copy icon
import { useForm } from "react-hook-form";
import Heading from "@/components/heading";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { formSchema } from "./constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import axios from "axios"; // Import axios
import { useRouter } from "next/navigation";
import { Empty } from "@/components/empty";
import { Loader } from "@/components/loader";
import { UserAvatar } from "@/components/user-avatar";
import { BotAvatar } from "@/components/bot-avatar";
import ReactMarkdown from "react-markdown";
import { useProModal } from "@/hooks/use-pro-modal";
import toast from "react-hot-toast";

type Message = {
  role: "user" | "bot";
  content: string;
};

const CodePage = () => {
  const proModal=useProModal();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null); // State for tracking the copied message index

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post('/api/conversation', {
        body: values.prompt,
      },
      {
        headers: {
          'Authorization': process.env.GEMINI_API_KEY,
        },
      });
  
      // Handle the response data
      setMessages((prev) => [
        ...prev,
        { role: "user", content: values.prompt },
        { role: "bot", content: response.data.output },
      ]);
      form.reset();
    } 

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error:any) {
      if (error?.response?.status === 403) 
        proModal.onOpen();
      else {toast.error("Something went wrong.")};
    }
   
  };
  

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index); // Set the index of the copied message
      setTimeout(() => setCopiedIndex(null), 2000); // Remove "Copied!" after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
    finally{
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="Code Generation"
        description="Generate code using descriptive text."
        icon={Code}
        iconColor="text-green-500"
        bgColor="bg-green-700/10"
      />
      <div className="px-4 lg:px-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl className="m-0 p-0">
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent text-slate-500 text-md"
                      disabled={isLoading}
                      placeholder="Give me the syntax of java for printing the line."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="col-span-12 lg:col-span-2 w-full"
              disabled={isLoading}
            >
              Generate
            </Button>
          </form>
        </Form>
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {messages.length === 0 && !isLoading && (
            <Empty label="No Conversation Started Yet." />
          )}
          <div className="flex flex-col-reverse gap-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "p-8 w-full flex items-start gap-x-8 text-slate-800 rounded-lg relative", // Add relative for positioning
                  message.role === "user"
                    ? "bg-white border border-black/10"
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                <div className="flex-grow">
                  <ReactMarkdown
                    components={{
                      pre: ({ ...props }) => (
                        <div className="overflow-auto w-full my-2 bg-green/10 p-2 rounded-lg">
                          <pre {...props} />
                        </div>
                      ),
                      code: ({ ...props }) => (
                        <code className="bg-black/20 text-2xl rounded-lg p-1" {...props} />
                      ),
                    }}
                    className="text-l overflow-hidden leading-7"
                  >
                    {message.content || ""}
                  </ReactMarkdown>
                </div>
                <div className="absolute top-5 right-10 flex items-center space-x-2">
                  <Button
                    onClick={() => copyToClipboard(message.content, index)}
                    className="p-2 border border-gray-300 hover:bg-gray-200"
                    size="sm"
                    variant="outline"
                  >
                    <Copy size={16} /> {/* Use the Copy icon */}
                  </Button>
                  {copiedIndex === index && (
                    <span className="text-slate-500 text-sm">Copied!</span> // Show "Copied!" message
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePage;
