import { useState } from 'react'

export default function useWritingLabState(activeAtoms) {
  const [activeTab, setActiveTab] = useState('grammar')

  // Slot 1 — grammar target
  const [targetAtomIds, setTargetAtomIds] = useState(() => new Set(activeAtoms.slice(0, 1)))
  const [difficulty, setDifficulty] = useState(1)

  // Slot 2 — vocabulary context
  const [vocabMode,        setVocabMode]        = useState('auto')
  const [selectedTopicKey, setSelectedTopicKey] = useState(null)

  // Slot 3 — scope
  const [scopeOverride, setScopeOverride] = useState(null)

  // Slot 4 — force
  const [forceMode,   setForceMode]   = useState('auto')
  const [customForce, setCustomForce] = useState('')

  // Portrait
  const [quantOn,     setQuantOn]     = useState(false)
  const [qualOn,      setQualOn]      = useState(false)
  const [quantText,   setQuantText]   = useState('')
  const [qualText,    setQualText]    = useState('')
  const [sampleState, setSampleState] = useState('idle')

  // L1
  const [l1Result,     setL1Result]     = useState(null)
  const [l1Loading,    setL1Loading]    = useState(false)
  const [showL1Prompt, setShowL1Prompt] = useState(false)
  const [showL1Output, setShowL1Output] = useState(false)

  // L2
  const [l2Result,     setL2Result]     = useState(null)
  const [l2Loading,    setL2Loading]    = useState(false)
  const [showL2Prompt, setShowL2Prompt] = useState(false)
  const [showL2Output, setShowL2Output] = useState(false)

  // L3
  const [l3FreeOutput, setL3FreeOutput] = useState(null)
  const [l3AskOutput,  setL3AskOutput]  = useState(null)
  const [l3Loading,    setL3Loading]    = useState(null)
  const [l3Error,      setL3Error]      = useState(null)
  const [showL3Prompt, setShowL3Prompt] = useState(false)
  const [showL3Output, setShowL3Output] = useState(false)

  // L4
  const [freeOutput,   setFreeOutput]   = useState(null)
  const [freeLoading,  setFreeLoading]  = useState(false)
  const [freeError,    setFreeError]    = useState(null)
  const [showL4Prompt, setShowL4Prompt] = useState(false)
  const [showL4Output, setShowL4Output] = useState(false)

  // L5
  const [mirrorOutput,      setMirrorOutput]      = useState(null)
  const [circuitTokens,     setCircuitTokens]     = useState(null)
  const [userCircuitTokens, setUserCircuitTokens] = useState(null)
  const [mirrorLoading, setMirrorLoading] = useState(false)
  const [mirrorError,   setMirrorError]   = useState(null)
  const [showL5Prompt,  setShowL5Prompt]  = useState(false)
  const [showL5Output,  setShowL5Output]  = useState(false)

  // Custom L5
  const [customL5,      setCustomL5]      = useState('')
  const [customOutput,  setCustomOutput]  = useState(null)
  const [customTokens,  setCustomTokens]  = useState(null)
  const [customLoading, setCustomLoading] = useState(false)
  const [customError,   setCustomError]   = useState(null)

  // Generate + submit
  const [generatedPrompt, setGeneratedPrompt] = useState(null)
  const [userResponse,    setUserResponse]    = useState('')
  const [generating,      setGenerating]      = useState(false)
  const [error,           setError]           = useState(null)
  const [copied,          setCopied]          = useState(false)
  const [submitting,      setSubmitting]      = useState(false)
  const [submissionTrace, setSubmissionTrace] = useState(null)

  return {
    activeTab, setActiveTab,
    targetAtomIds, setTargetAtomIds,
    difficulty, setDifficulty,
    vocabMode, setVocabMode,
    selectedTopicKey, setSelectedTopicKey,
    scopeOverride, setScopeOverride,
    forceMode, setForceMode,
    customForce, setCustomForce,
    quantOn, setQuantOn,
    qualOn, setQualOn,
    quantText, setQuantText,
    qualText, setQualText,
    sampleState, setSampleState,
    l1Result, setL1Result,
    l1Loading, setL1Loading,
    showL1Prompt, setShowL1Prompt,
    showL1Output, setShowL1Output,
    l2Result, setL2Result,
    l2Loading, setL2Loading,
    showL2Prompt, setShowL2Prompt,
    showL2Output, setShowL2Output,
    l3FreeOutput, setL3FreeOutput,
    l3AskOutput, setL3AskOutput,
    l3Loading, setL3Loading,
    l3Error, setL3Error,
    showL3Prompt, setShowL3Prompt,
    showL3Output, setShowL3Output,
    freeOutput, setFreeOutput,
    freeLoading, setFreeLoading,
    freeError, setFreeError,
    showL4Prompt, setShowL4Prompt,
    showL4Output, setShowL4Output,
    mirrorOutput, setMirrorOutput,
    circuitTokens, setCircuitTokens,
    userCircuitTokens, setUserCircuitTokens,
    mirrorLoading, setMirrorLoading,
    mirrorError, setMirrorError,
    showL5Prompt, setShowL5Prompt,
    showL5Output, setShowL5Output,
    customL5, setCustomL5,
    customOutput, setCustomOutput,
    customTokens, setCustomTokens,
    customLoading, setCustomLoading,
    customError, setCustomError,
    generatedPrompt, setGeneratedPrompt,
    userResponse, setUserResponse,
    generating, setGenerating,
    error, setError,
    copied, setCopied,
    submitting, setSubmitting,
    submissionTrace, setSubmissionTrace,
  }
}
