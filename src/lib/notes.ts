import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import type { Note } from './types'

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }, [user])
  useEffect(() => { reload() }, [reload])

  const create = async (courseId: string | null = null, title = ''): Promise<Note | null> => {
    if (!user) return null
    const { data } = await supabase.from('notes').insert({ user_id: user.id, course_id: courseId, title }).select().single()
    if (data) setNotes((prev) => [data, ...prev])
    return data
  }
  const update = (note: Note) => setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
  const remove = async (note: Note) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    await supabase.from('notes').delete().eq('id', note.id)
  }
  return { notes, loading, reload, create, update, remove }
}
