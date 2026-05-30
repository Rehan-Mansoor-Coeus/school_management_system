import LetterQueuePage from './LetterQueuePage'
import { useLettersI18n } from '../../hooks/useLettersI18n'

export default function LetterListingPage() {
  const { t } = useLettersI18n()
  return <LetterQueuePage title={t('letterListing')} />
}
