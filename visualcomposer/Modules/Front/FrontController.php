<?php

namespace VisualComposer\Modules\Front;

use VisualComposer\Helpers\Generic\Templates;
use VisualComposer\Helpers\WordPress\Options;
use VisualComposer\Helpers\Generic\Url;
use Illuminate\Contracts\Events\Dispatcher;
use VisualComposer\Modules\Access\CurrentUserAccess;
use VisualComposer\Modules\System\Container;

class FrontController extends Container {
	/**
	 * @var bool
	 */
	protected static $jsScriptRendered = false;

	/**
	 * @var \Illuminate\Contracts\Events\Dispatcher
	 */
	protected $event;

	/**
	 * PageFrontController constructor.
	 *
	 * @param \Illuminate\Contracts\Events\Dispatcher $event
	 */
	public function __construct( Dispatcher $event ) {
		$this->event = $event;
		add_action( 'wp_head', function () {
			$this->call( 'appendScript' );
		} );

		add_action( 'wp_enqueue_scripts', function () {
			wp_enqueue_script( 'jquery' );
		} );

		add_filter( 'edit_post_link', function () {
			$args = func_get_args();

			return $this->call( 'addEditPostLink', $args );
		} );
	}

	/**
	 * @param $link
	 *
	 * @return string
	 */
	private function addEditPostLink( $link, CurrentUserAccess $currentUserAccess ) {
		if ( $currentUserAccess->part( 'frontend' )->can() ) {
			$link .= ' <a href="' . Url::ajax( [
					'vc-v-action' => 'frontend',
					'vc-source-id' => get_the_ID(),
				] ) . '">' . __( 'Edit with VC5', 'vc5' ) . '</a>';
			if ( ! self::$jsScriptRendered ) {
				$link .= $this->outputScripts();
				self::$jsScriptRendered = true;
			}

		}

		return $link;
	}

	/**
	 * Output less.js script to page header
	 */
	private function appendScript() {
		echo '<script src="' . Url::to( 'node_modules/less/dist/less.js' ) . '" data-async="true"></script>';
	}

	/**
	 * Output used assets
	 *
	 * @return string
	 */
	private function outputScripts() {
		$scriptsBundle = Options::get( 'scriptsBundle', [ ] );
		$stylesBundle = Options::get( 'stylesBundle', [ ] );
		$args = compact( 'scriptsBundle', 'stylesBundle' );

		return Templates::render( 'front/frontend-scripts-styles', $args, false );
	}
}