"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Group = { id: string; name: string };
type Topic = { id: string; groupId: string; name: string; wordCount: number };
type Word = { id: string; topicId: string; word: string; meaning: string | null; example: string | null; translation: string | null; synonyms: string[] };

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = (await response.json()) as { error?: string; [key: string]: unknown };
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Request failed.");
  return payload;
}

function GroupRow({ group }: { group: Group }) {
  const [name, setName] = useState(group.name); const [loading, setLoading] = useState(false);
  async function save() { setLoading(true); try { await jsonFetch(`/api/admin/vocabulary/groups/${group.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }); toast.success("Group updated."); window.location.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update group."); } finally { setLoading(false); } }
  async function remove() { if (!window.confirm(`Delete group "${group.name}" and all of its topics/words?`)) return; setLoading(true); try { await jsonFetch(`/api/admin/vocabulary/groups/${group.id}`, { method: "DELETE" }); toast.success("Group deleted."); window.location.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete group."); } finally { setLoading(false); } }
  return <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} /><Button size="icon" onClick={save} disabled={loading || name === group.name} aria-label={`Save ${group.name}`}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</Button><Button size="icon" variant="danger" onClick={remove} disabled={loading} aria-label={`Delete ${group.name}`}><Trash2 className="h-4 w-4" /></Button></div>;
}

function TopicRow({ topic, groups }: { topic: Topic; groups: Group[] }) {
  const [name, setName] = useState(topic.name); const [groupId, setGroupId] = useState(topic.groupId); const [loading, setLoading] = useState(false);
  async function save() { setLoading(true); try { await jsonFetch(`/api/admin/vocabulary/topics/${topic.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, groupId }) }); toast.success("Topic updated."); window.location.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update topic."); } finally { setLoading(false); } }
  async function remove() { if (!window.confirm(`Delete topic "${topic.name}" and its ${topic.wordCount} word(s)?`)) return; setLoading(true); try { await jsonFetch(`/api/admin/vocabulary/topics/${topic.id}`, { method: "DELETE" }); toast.success("Topic deleted."); window.location.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete topic."); } finally { setLoading(false); } }
  return <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"><Input value={name} onChange={(e) => setName(e.target.value)} /><select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm">{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select><Button size="icon" onClick={save} disabled={loading || (name === topic.name && groupId === topic.groupId)} aria-label={`Save ${topic.name}`}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</Button><Button size="icon" variant="danger" onClick={remove} disabled={loading} aria-label={`Delete ${topic.name}`}><Trash2 className="h-4 w-4" /></Button></div>;
}

function WordRow({ word, onSaved }: { word: Word; onSaved: () => void }) {
  const [value, setValue] = useState({ word: word.word, meaning: word.meaning ?? "", example: word.example ?? "", translation: word.translation ?? "", synonyms: word.synonyms.join(", ") });
  const [loading, setLoading] = useState(false);
  async function save() { setLoading(true); try { await jsonFetch(`/api/admin/vocabulary/words/${word.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }); toast.success(`Saved ${value.word}.`); onSaved(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save word."); } finally { setLoading(false); } }
  async function remove() { if (!window.confirm(`Delete "${word.word}"?`)) return; setLoading(true); try { await jsonFetch(`/api/admin/vocabulary/words/${word.id}`, { method: "DELETE" }); toast.success("Word deleted."); onSaved(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete word."); } finally { setLoading(false); } }
  return <Card className="p-4"><div className="grid gap-3 lg:grid-cols-2"><div className="space-y-2"><Label>Word</Label><Input value={value.word} onChange={(e) => setValue((v) => ({ ...v, word: e.target.value }))} /></div><div className="space-y-2"><Label>Vietnamese explanation</Label><Input value={value.translation} onChange={(e) => setValue((v) => ({ ...v, translation: e.target.value }))} /></div><div className="space-y-2"><Label>Meaning</Label><Textarea className="min-h-24" value={value.meaning} onChange={(e) => setValue((v) => ({ ...v, meaning: e.target.value }))} /></div><div className="space-y-2"><Label>Example sentence</Label><Textarea className="min-h-24" value={value.example} onChange={(e) => setValue((v) => ({ ...v, example: e.target.value }))} /></div><div className="space-y-2 lg:col-span-2"><Label>Synonyms (comma-separated)</Label><Input value={value.synonyms} onChange={(e) => setValue((v) => ({ ...v, synonyms: e.target.value }))} /></div></div><div className="mt-4 flex gap-2"><Button size="sm" onClick={save} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save word</Button><Button size="sm" variant="danger" onClick={remove} disabled={loading}><Trash2 className="h-4 w-4" />Delete</Button></div></Card>;
}

export function VocabularyManager({ groups, topics }: { groups: Group[]; topics: Topic[] }) {
  const [newGroup, setNewGroup] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newTopicGroup, setNewTopicGroup] = useState(groups[0]?.id ?? "");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [bulk, setBulk] = useState("");
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadWords = useCallback(async () => {
    if (!topicId) { setWords([]); return; }
    setLoadingWords(true);
    try { const payload = await jsonFetch(`/api/admin/vocabulary/words?topicId=${encodeURIComponent(topicId)}`); setWords((payload.words as Word[]) ?? []); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not load words."); } finally { setLoadingWords(false); }
  }, [topicId]);
  useEffect(() => { void loadWords(); }, [loadWords]);

  async function addGroup() { setBusy(true); try { await jsonFetch("/api/admin/vocabulary/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newGroup }) }); toast.success("Group added."); window.location.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not add group."); } finally { setBusy(false); } }
  async function addTopic() { setBusy(true); try { await jsonFetch("/api/admin/vocabulary/topics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTopic, groupId: newTopicGroup }) }); toast.success("Topic added."); window.location.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not add topic."); } finally { setBusy(false); } }
  async function addBulk() { if (!topicId || !bulk.trim()) return; setBusy(true); try { const payload = await jsonFetch("/api/admin/vocabulary/words/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicId, words: bulk }) }); toast.success(`Added ${String(payload.created ?? 0)} new word(s).`); setBulk(""); await loadWords(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not add words."); } finally { setBusy(false); } }

  return <div className="space-y-8"><div className="grid gap-5 xl:grid-cols-2"><Card className="p-5"><h2 className="font-semibold">Groups</h2><div className="mt-4 flex gap-2"><Input placeholder="Academic Vocabulary" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} /><Button onClick={addGroup} disabled={busy || newGroup.trim().length < 2}><Plus className="h-4 w-4" />Add</Button></div><div className="mt-4 space-y-2">{groups.map((group) => <GroupRow key={group.id} group={group} />)}</div></Card><Card className="p-5"><h2 className="font-semibold">Topics</h2><div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input placeholder="Environment" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} /><select value={newTopicGroup} onChange={(e) => setNewTopicGroup(e.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm">{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select><Button onClick={addTopic} disabled={busy || !newTopicGroup || newTopic.trim().length < 2}><Plus className="h-4 w-4" />Add</Button></div><div className="mt-4 space-y-2">{topics.map((topic) => <TopicRow key={topic.id} topic={topic} groups={groups} />)}</div></Card></div><Card className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="w-full max-w-md space-y-2"><Label>Manage words in topic</Label><select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="h-11 w-full rounded-xl border bg-white px-3 text-sm"><option value="">Choose topic</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{groups.find((group) => group.id === topic.groupId)?.name} / {topic.name} ({topic.wordCount})</option>)}</select></div><Button variant="outline" onClick={loadWords} disabled={loadingWords || !topicId}>{loadingWords ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Refresh</Button></div><div className="mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><div><Label>Quick add — one vocabulary per line</Label><Textarea className="mt-2 min-h-52 font-mono" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"environment\nsustainable\nrenewable\npollution"} /><Button className="mt-3" onClick={addBulk} disabled={busy || !topicId || !bulk.trim()}><Plus className="h-4 w-4" />Bulk add</Button></div><div><Label>Word details</Label><div className="mt-2 max-h-[720px] space-y-3 overflow-y-auto pr-1">{loadingWords ? <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div> : words.length ? words.map((word) => <WordRow key={word.id} word={word} onSaved={loadWords} />) : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">No words in this topic yet.</div>}</div></div></div></Card></div>;
}
