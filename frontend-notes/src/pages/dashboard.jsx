import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://127.0.0.1:8000";

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bufferText, setBufferText] = useState(""); 
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const wsRef = useRef(null);
  const quillRef = useRef(null); // <-- new ref

  const token = localStorage.getItem("access_token");

  //  FETCH NOTES 
  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/notes/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch notes");
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchNotes();
  }, []);

  const selectNote = (note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content || "");
    setBufferText("");
    setAudioBlob(null);
    setAudioURL(note.voice_message || "");
  };

  const saveNote = async () => {
    if (!title.trim()) {
      toast.warning("Title required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content || "");
    if (audioBlob) formData.append("file", audioBlob, "voice.webm");

    try {
      let res;
      if (activeNote) {
        res = await axios.put(`${API_BASE}/notes/update/${activeNote.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Note updated successfully");
      } else {
        res = await axios.post(`${API_BASE}/notes/create`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Note created successfully");
      }

      const savedNote = res.data;
      setNotes((prev) => {
        const index = prev.findIndex((n) => n.id === savedNote.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = savedNote;
          return updated;
        }
        return [savedNote, ...prev];
      });

      setActiveNote(savedNote);
      setTitle(savedNote.title);
      setContent(savedNote.content || "");
      setBufferText("");
      setAudioBlob(null);
      setAudioURL(savedNote.voice_message || "");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save note");
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_BASE}/notes/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setActiveNote(null);
      setTitle("");
      setContent("");
      setBufferText("");
      setAudioBlob(null);
      setAudioURL("");
      toast.success("Note deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete note");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error(error);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  // ================== LIVE VOICE-TO-TEXT ==================
  const startTranscription = () => {
    if (transcribing) return;

    wsRef.current = new WebSocket(`ws://127.0.0.1:8000/voice/ws?token=${token}`);

    wsRef.current.onopen = () => {
      console.log("Connected to Vosk WebSocket");
      setTranscribing(true);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (!data.text) return;

        if (data.final) {
          setContent((prev) => {
            const updated = prev ? prev + " " + data.text : data.text;
            setTimeout(() => moveCursorToEnd(), 0); //  move cursor after render
            return updated;
          });
          setBufferText("");
        } else {
          setContent((prev) => {
            const withoutBuffer = prev.replace(bufferText, "");
            const updated = withoutBuffer + data.text;
            setTimeout(() => moveCursorToEnd(), 0); // <-- move cursor after render
            return updated;
          });
          setBufferText(data.text);
        }
      } catch {
        const newChunk = event.data.trim();
        if (!newChunk) return;
        setContent((prev) => {
          const updated = prev ? prev + " " + newChunk : newChunk;
          setTimeout(() => moveCursorToEnd(), 0);
          return updated;
        });
      }
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      setTranscribing(false);
      setBufferText("");
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket error", err);
      toast.error("WebSocket connection failed. Check token or server.");
      setTranscribing(false);
      setBufferText("");
    };
  };

  const stopTranscription = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setTranscribing(false);
      setBufferText("");
      console.log("Live transcription stopped");
    }
  };

  //  MOVE CURSOR TO END 
  const moveCursorToEnd = () => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const length = editor.getLength();
      editor.setSelection(length, length);
    }
  };

  // UI 
  return (
    <div className="flex h-screen">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="w-64 bg-gray-900 text-white p-4">
        <button
          className="w-full bg-blue-600 p-2 mb-3"
          onClick={() => {
            setActiveNote(null);
            setTitle("");
            setContent("");
            setBufferText("");
            setAudioBlob(null);
            setAudioURL("");
          }}
        >
          + New Note
        </button>

        {notes.map((n) => (
          <div
            key={n.id}
            className="flex justify-between p-2 cursor-pointer hover:bg-gray-700"
          >
            <span onClick={() => selectNote(n)}>{n.title}</span>
            <button onClick={() => deleteNote(n.id)}>X</button>
          </div>
        ))}
      </div>

      <div className="flex-1 p-5">
        <input
          className="border p-2 w-full mb-3"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="relative mb-4">
          <ReactQuill
            ref={quillRef} // <-- attach ref
            value={content}
            onChange={setContent}
            placeholder="Type or speak here..."
            className="border rounded-lg"
            style={{ minHeight: "200px" }}
          />
          <button
            onClick={transcribing ? stopTranscription : startTranscription}
            className={`absolute right-3 top-1 p-2 rounded-full text-white shadow-lg ${
              transcribing ? "bg-red-600" : "bg-green-600"
            }`}
            title={transcribing ? "Stop Transcription" : "Start Transcription"}
          >
            {transcribing ? "🎤" : "🎙️"}
          </button>
        </div>

        <div className="mt-2">
  {!recording ? (
    <button
      onClick={startRecording}
      className="bg-green-600 text-white px-4 py-2 mr-3"
    >
      {audioBlob || audioURL ? "Update Recording" : "Start Recording"}
    </button>
  ) : (
    <button
      onClick={stopRecording}
      className="bg-red-600 text-white px-4 py-2 mr-3"
    >
      Stop Recording
    </button>
  )}

  {audioURL && (
    <audio key={audioURL} controls src={audioURL} className="mt-3 w-full" />
  )}
</div>

        <button
          onClick={saveNote}
          className="mt-5 bg-blue-600 text-white px-6 py-2"
        >
          {activeNote ? "Update Note" : "Save Note"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
