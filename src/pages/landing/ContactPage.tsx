import { useState } from 'react'
import { Mail, MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="border-b bg-muted/30 py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Get in touch</h1>
          <p className="text-lg text-muted-foreground">
            Have a question, suggestion, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-5 gap-12">

          {/* Left info */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4">Contact info</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">hello@rielios.app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Response time</p>
                    <p className="text-sm text-muted-foreground">Usually within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-5">
                <p className="text-sm font-semibold mb-1">Found a bug?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Please describe exactly what happened, what you expected, and any steps to reproduce it. Screenshots are always helpful.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12 border rounded-2xl bg-muted/30">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Message sent!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What's this about?" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us everything…"
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  Send message <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
