import React, { useContext, useMemo } from 'react'
import classNames from 'classnames'

import { ProductListContext } from 'vtex.product-list-context'
import { Spinner } from 'vtex.styleguide'
import { useCssHandles } from 'vtex.css-handles'
import { useResponsiveValue } from 'vtex.responsive-values'
import { useRuntime } from 'vtex.render-runtime'
import { SearchPageContext } from 'vtex.search-page-context'

import GalleryLayoutRow from './components/GalleryLayoutRow'
import SettingsContext from './components/SettingsContext'
import ProductListEventCaller from './utils/ProductListEventCaller'

const LAZY_RENDER_THRESHOLD = 2

const CSS_HANDLES = ['gallery'] as const

const { ProductListProvider } = ProductListContext
const { useSearchPageState } = SearchPageContext

const GalleryLayout: React.FC<GalleryLayoutProps> = ({
  layouts,
  lazyItemsRemaining,
  products,
  showingFacets,
  summary,
  slots,
}) => {
  const { trackingId = 'Search result' } = useContext(SettingsContext) || {}
  const handles = useCssHandles(CSS_HANDLES)
  const { getSettings } = useRuntime()
  const { galleryLayout } = useSearchPageState()

  const currentLayoutOption = useMemo(() => {
    let layoutOption

    if (galleryLayout) {
      layoutOption = layouts.find(layout => layout.name === galleryLayout)
    }

    return layoutOption ?? layouts[0]
  }, [galleryLayout, layouts])

  const itemsPerRow = useResponsiveValue(currentLayoutOption.itemsPerRow)

  const galleryRows = useMemo(() => {
    const galleryRows = []

    let i = 0

    while (i * itemsPerRow < products.length) {
      const start = i * itemsPerRow
      const end = (i + 1) * itemsPerRow

      galleryRows.push(products.slice(start, end))
      i++
    }

    return galleryRows
  }, [itemsPerRow, products])

  if (!layouts || layouts.length === 0) {
    return null
  }

  const galleryClasses = classNames(
    handles.gallery,
    'flex flex-row flex-wrap items-stretch bn ph1 na4',
    {
      'justify-center': !showingFacets,
      'pl9-l': showingFacets,
    }
  )

  const isLazyRenderEnabled = getSettings('vtex.store')
    ?.enableSearchRenderingOptimization

  return (
    <ProductListProvider listName={trackingId as string}>
      <div className={galleryClasses}>
        {galleryRows.map((rowProducts, index) => (
          <GalleryLayoutRow
            key={`${currentLayoutOption.name}-${index}`}
            products={rowProducts}
            lazyRender={!!isLazyRenderEnabled && index >= LAZY_RENDER_THRESHOLD}
            summary={summary}
            displayMode="normal"
            itemsPerRow={itemsPerRow}
            GalleryItemComponent={slots[currentLayoutOption.component]}
          />
        ))}
        {typeof lazyItemsRemaining === 'number' && lazyItemsRemaining > 0 && (
          <div
            style={{
              width: '100%',
              // Approximate number, just to add scroll leeway
              height: 300 * Math.ceil(lazyItemsRemaining / itemsPerRow),
            }}
            className="flex justify-center pt10"
          >
            <Spinner />
          </div>
        )}
      </div>
      <ProductListEventCaller />
    </ProductListProvider>
  )
}

export default GalleryLayout
