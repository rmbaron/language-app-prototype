import { useState, useEffect } from 'react'
import Hub from './Hub'
import WordBank from './WordBank'
import WorldSphere from './WorldSphere'
import PracticeHub from './PracticeHub'
import WordProfile from './WordProfile'
import WordPractice from './WordPractice'
import ContentManager from './ContentManager'
import DiscoverWords from './DiscoverWords'
import AddWord from './AddWord'
import Onboarding from './Onboarding'
import CelestialScreen from './CelestialScreen'
import CelestialEditor from './CelestialEditor'
import { loadState, getWordBank, ACTIVE_LIMIT } from './userStore'
import { getDepthLevel, recordSession, getActiveLanguage } from './learnerProfile'
import { runLayerOneBatch } from './wordEnrichment'
import { runLayerTwoBatch } from './wordEnrichmentTwo'
import WordPipeline from './WordPipeline'
import FlashcardMode from './FlashcardMode'
import SentenceLab from './SentenceLab'
import WorldReadingLane from './WorldReadingLane'
import ProfileSwitcher from './ProfileSwitcher'
import Constructor from './Constructor'
import { getBankedWords } from './wordRegistry'
import { useInventory } from './InventoryContext'
import WritingPractice from './WritingPractice'
import WritingLab from './WritingLab'
import CircuitTest from './CircuitTest'
import InventoryMirror from './InventoryMirror'
import './inventory-mirror.css'


export default function App() {
  const { refreshInventory } = useInventory()
  const [view, setView] = useState('hub')
  const [selected, setSelected] = useState(null)
  const [practicing, setPracticing] = useState(false)
  const [storeData, setStoreData] = useState(loadState)
  const [adminOpen, setAdminOpen] = useState(false)
  const [pipelineOpen, setPipelineOpen] = useState(false)
  const [discoverOpen, setDiscoverOpen] = useState(false)
  const [addWordOpen, setAddWordOpen]   = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [flashcardOpen, setFlashcardOpen]     = useState(false)
  const [celestialOpen, setCelestialOpen]     = useState(false)
  const [celestialJump, setCelestialJump]     = useState(null)
  const [editorSequence, setEditorSequence]   = useState(null)
  const [ghostSettings, setGhostSettings]     = useState(null)
  const [activeCappedAlert, setActiveCappedAlert] = useState(false)

  useEffect(() => {
    recordSession()
// auto-batch disabled — run manually from Pipeline screen
    // runLayerOneBatch('en')
    //   .then(() => runLayerTwoBatch('en'))
    //   .catch(() => {})
  }, [])

  function refreshStore(result) {
    setStoreData(loadState())
    refreshInventory()
    if (result?.activeCapped) setActiveCappedAlert(true)
  }

  if (adminOpen) {
    return <ContentManager onClose={() => setAdminOpen(false)} />
  }

  if (pipelineOpen) {
    return <WordPipeline onClose={() => setPipelineOpen(false)} />
  }

  if (discoverOpen) {
    return <DiscoverWords onBack={() => setDiscoverOpen(false)} onWordAdded={refreshStore} />
  }

  if (addWordOpen) {
    return <AddWord onBack={() => setAddWordOpen(false)} onWordAdded={refreshStore} />
  }

  if (onboardingOpen) {
    return <Onboarding onComplete={() => setOnboardingOpen(false)} />
  }

  if (celestialOpen) {
    return (
      <div className="dev-celestial-workspace">
        <div className="dev-phone-frame">
          <CelestialScreen
            onExit={() => setCelestialOpen(false)}
            framed
            jumpTo={celestialJump}
            onJumpConsumed={() => setCelestialJump(null)}
            sequence={editorSequence}
            ghostSettings={ghostSettings}
          />
        </div>
        <CelestialEditor workspace onJumpTo={setCelestialJump} onSequenceChange={setEditorSequence} onGhostChange={setGhostSettings} />
      </div>
    )
  }

  if (flashcardOpen) {
    const bankWords = getBankedWords(getWordBank(), getActiveLanguage())
    return <FlashcardMode bankWords={bankWords} onExit={() => setFlashcardOpen(false)} />
  }

  if (view === 'mirror') {
    return <InventoryMirror onBack={() => setView('hub')} />
  }

  if (view === 'circuitTest') {
    return <CircuitTest onClose={() => setView('hub')} />
  }

  return (
    <>
      {view === 'hub' ? (
        <Hub onNavigate={id => { setSelected(null); setPracticing(false); setView(id) }} />
      ) : view === 'worldSphere' ? (
        <WorldSphere onBack={() => setView('hub')} onNavigate={id => setView(id)} />
      ) : view === 'practice' ? (
        <PracticeHub onBack={() => setView('worldSphere')} onNavigate={id => setView(id)} />
      ) : view === 'sentenceLab' ? (
        <SentenceLab onBack={() => setView('practice')} />
      ) : view === 'practice_reading' ? (
        <WorldReadingLane onBack={() => setView('practice')} />
      ) : view === 'practice_writing' ? (
        <WritingPractice onBack={() => setView('practice')} />
      ) : view === 'practice_writing2' ? (
        <WritingLab onBack={() => setView('practice')} />
      ) : view === 'constructor' ? (
        <Constructor onBack={() => setView('hub')} />
      ) : view === 'profiles' ? (
        <ProfileSwitcher onBack={() => setView('hub')} />
      ) : selected && practicing ? (
        <WordPractice
          word={selected}
          onBack={() => setPracticing(false)}
          onStoreChange={refreshStore}
          depthLevel={getDepthLevel()}
        />
      ) : selected ? (
        <WordProfile
          word={selected}
          onBack={() => setSelected(null)}
          onPractice={() => setPracticing(true)}
          storeData={storeData}
          onStoreChange={refreshStore}
        />
      ) : (
        <WordBank onSelectWord={setSelected} onBack={() => setView('hub')} onAddWord={() => setAddWordOpen(true)} />
      )}


      <div className="dev-controls">
        <button className="dev-toggle" onClick={() => setAdminOpen(true)}>
          Admin
        </button>
        <button className="dev-toggle" onClick={() => setPipelineOpen(true)}>
          Pipeline
        </button>
        <button className="dev-toggle" onClick={() => setDiscoverOpen(true)}>
          Discover
        </button>
        <button className="dev-toggle" onClick={() => setOnboardingOpen(true)}>
          Onboarding
        </button>
        <button className="dev-toggle" onClick={() => setFlashcardOpen(true)}>
          Flashcards
        </button>
        <button className="dev-toggle" onClick={() => setView('mirror')}>
          Mirror
        </button>
        <button className="dev-toggle" onClick={() => setCelestialOpen(true)}>
          Celestial
        </button>
        <button className="dev-toggle" onClick={() => setView('circuitTest')}>
          Circuit Test
        </button>
      </div>

      {activeCappedAlert && (
        <div className="alert-overlay">
          <div className="alert-box">
            <p className="alert-message">Your active word limit ({ACTIVE_LIMIT}) is full. Complete some words before taking on more.</p>
            <button className="alert-ok" onClick={() => setActiveCappedAlert(false)}>OK</button>
          </div>
        </div>
      )}
    </>
  )
}
