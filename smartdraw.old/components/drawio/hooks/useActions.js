import { useCallback } from 'react';

/**
 * Hook to manage Draw.io iframe actions
 * @param {React.RefObject} iframeRef - Reference to the iframe element
 * @returns {Object} Action methods to interact with Draw.io
 */
export function useActions(iframeRef) {
  /**
   * Send a message to the Draw.io iframe
   * @param {Object} message - Message object to send
   */
  const postMessage = useCallback((message) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      console.warn('Iframe not ready');
      return;
    }

    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify(message),
        'https://embed.diagrams.net'
      );
    } catch (error) {
      console.error('Failed to send message to Draw.io:', error);
    }
  }, [iframeRef]);

  /**
   * Load a diagram into the editor
   * @param {Object} options - Load options
   * @param {string} options.xml - XML diagram data
   * @param {string} options.xmlpng - XML embedded in PNG
   * @param {Object} options.descriptor - CSV descriptor
   * @param {boolean} options.autosave - Enable autosave
   */
  const load = useCallback((options) => {
    const message = {
      action: 'load',
      autosave: options.autosave ? 1 : 0
    };

    if (options.xml !== undefined) {
      message.xml = options.xml || '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>';
    } else if (options.xmlpng) {
      message.xmlpng = options.xmlpng;
    } else if (options.descriptor) {
      message.descriptor = options.descriptor;
    }

    postMessage(message);
  }, [postMessage]);

  /**
   * Configure the Draw.io editor
   * @param {Object} options - Configuration options
   * @param {Object} options.config - Configuration object
   */
  const configure = useCallback((options) => {
    postMessage({
      action: 'configure',
      config: options.config
    });
  }, [postMessage]);

  /**
   * Export the current diagram
   * @param {Object} options - Export options
   * @param {string} options.format - Export format (png, svg, xmlpng, xmlsvg, etc.)
   * @param {boolean} options.exit - Whether to exit after export
   * @param {string} options.parentEvent - Parent event name for tracking
   */
  const exportDiagram = useCallback((options) => {
    const message = {
      action: 'export',
      format: options.format || 'xmlsvg'
    };

    // Internal use properties
    if (options.exit !== undefined) {
      message.exit = options.exit;
    }
    if (options.parentEvent) {
      message.parentEvent = options.parentEvent;
    }

    postMessage(message);
  }, [postMessage]);

  /**
   * Merge XML into the current diagram
   * @param {Object} options - Merge options
   * @param {string} options.xml - XML to merge
   */
  const merge = useCallback((options) => {
    postMessage({
      action: 'merge',
      xml: options.xml
    });
  }, [postMessage]);

  /**
   * Get the current diagram as XML
   */
  const getXml = useCallback(() => {
    postMessage({
      action: 'export',
      format: 'xml'
    });
  }, [postMessage]);

  /**
   * Prompt the user with a dialog
   * @param {Object} options - Prompt options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   */
  const prompt = useCallback((options) => {
    postMessage({
      action: 'prompt',
      title: options.title,
      message: options.message
    });
  }, [postMessage]);

  /**
   * Load a template
   * @param {Object} options - Template options
   * @param {string} options.xml - Template XML
   */
  const template = useCallback((options) => {
    postMessage({
      action: 'template',
      xml: options.xml
    });
  }, [postMessage]);

  return {
    load,
    configure,
    exportDiagram,
    merge,
    getXml,
    prompt,
    template
  };
}

/**
 * Type helper for unique action properties
 * This is a placeholder for TypeScript compatibility
 */
export function UniqueActionProps() {
  return {};
}
