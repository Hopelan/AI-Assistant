"use client";
import { Box, Button, Stack, TextField } from "@mui/material";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm here to help you with translations between Chinese and American English. Type the text you would like me to translate directly below"
    }
      ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!message.trim()) return; // Don't send empty messages

    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
        const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
        })

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
    
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1]
            let otherMessages = messages.slice(0, messages.length - 1)
            return [
              ...otherMessages,
              { ...lastMessage, content: lastMessage.content + text },
            ]
          })
        }
      }catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
        }
      }

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      sx={{
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      p: 1, // Add padding to prevent content from touching screen edges
    }}
      
    >

      <Stack
        direction="column"
        spacing={3}
        sx={{
          width: {
            xs: "100%",    // Full width on extra-small screens
            sm: "90%",     // 90% width on small screens
            md: "600px",   // 600px width on medium screens and up
          },
          height: {
            xs: "100%",    // Full height on extra-small screens
            sm: "90%",     // 90% height on small screens
            md: "700px",   // 700px height on medium screens and up
          },
          border: "1px solid black",
          borderRadius: 2, // Add some border radius for aesthetics
          p: 2,            // Padding inside the Stack
          boxSizing: "border-box",
          overflow: "hidden", // Hide overflow to prevent content spill
        }}
        
      >

        
        <Stack
          direction={"column"}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                bgcolor={
                  message.role === "assistant"
                    ? "primary.main"
                    : "secondary.main"
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={"row"} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
