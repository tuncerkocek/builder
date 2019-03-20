<?php

namespace VisualComposer\Modules\Hub\Unsplash;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use http\Exception\UnexpectedValueException;
use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Access\CurrentUser;
use VisualComposer\Helpers\File;
use VisualComposer\Helpers\License;
use VisualComposer\Helpers\Request;
use VisualComposer\Helpers\Traits\EventsFilters;

class UnsplashDownloadController extends Container implements Module
{
    use EventsFilters;
    protected $message = false;
    protected $capability = 'upload_files';

    public function __construct()
    {
        /** @see \VisualComposer\Modules\Settings\Ajax\SystemStatusController::runAllChecks */
        $this->addFilter(
            'vcv:ajax:hub:unsplash:download:adminAjax',
            'download'
        );
        $this->addFilter('vcv:editor:variables', 'addVariables');
    }

    /**
     * Download image from Unsplash
     *
     * @param $response
     * @param $payload
     * @param \VisualComposer\Helpers\Request $requestHelper
     * @param \VisualComposer\Helpers\License $licenseHelper
     * @param \VisualComposer\Helpers\Access\CurrentUser $currentUserHelper
     * @param \VisualComposer\Helpers\File $fileHelper
     *
     * @return array
     */
    protected function download(
        $response,
        $payload,
        Request $requestHelper,
        License $licenseHelper,
        CurrentUser $currentUserHelper,
        File $fileHelper
    ) {
        if ($currentUserHelper->wpAll($this->capability)->get() && $licenseHelper->isActivated()
            && $requestHelper->exists(
                'vcv-image'
            )) {
            $imageUrl = $requestHelper->input('vcv-image');
            $parseUrl = parse_url($imageUrl);
            $imageType = exif_imagetype($imageUrl);
            if (preg_match('|(.*)(.unsplash.com)$|', $parseUrl['host'])
                && in_array(
                    $imageType,
                    [IMAGETYPE_JPEG, IMAGETYPE_PNG]
                )) {
                $tempImage = $fileHelper->download($imageUrl);

                if (!vcIsBadResponse($tempImage)) {
                    $results = $this->moveTemporarilyToUploads($parseUrl, $imageType, $tempImage);

                    if (!isset($results['error']) && $this->addImageToMediaLibrary($results)) {
                        return ['status' => true];
                    }

                    $this->message = $this->setMessage(esc_html($results->get_error_message()) . ' #10080');
                }

                $this->message = $this->setMessage(__('Failed to download image, make sure that your upload folder is writable and please try again!', 'vcwb') . ' #10081');
            }

            $this->message = $this->setMessage(__('Unknown image provider or format.', 'vcwb') . ' #10082');
        }

        $this->message = $this->setMessage(__('No access, please check your license and make sure your capabilities allow to upload files!', 'vcwb') . ' #10083');

        return ['status' => false, 'message' => $this->message];
    }

    /**
     * @param $message
     *
     * @return bool|string
     */
    protected function setMessage($message)
    {
        if (!$this->message) {
            return $message;
        }

        return $this->message;
    }

    /**
     * @param $variables
     * @param \VisualComposer\Helpers\License $licenseHelper
     *
     * @param \VisualComposer\Helpers\Access\CurrentUser $currentUserHelper
     *
     * @return array
     */
    protected function addVariables($variables, License $licenseHelper, CurrentUser $currentUserHelper)
    {
        if ($currentUserHelper->wpAll($this->capability)->get() && $licenseHelper->isActivated()) {
            $variables[] = [
                'key' => 'VCV_LICENSE_KEY',
                'value' => $licenseHelper->getKey(),
                'type' => 'constant',
            ];
        }

        return $variables;
    }

    /**
     * Add image to media library
     *
     * @param array $results
     *
     * @return bool|int
     */
    protected function addImageToMediaLibrary(array $results)
    {
        $attachment = [
            'guid' => $results['url'],
            'post_mime_type' => $results['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', basename($results['file'])),
            'post_content' => '',
            'post_status' => 'inherit',
        ];

        $attachment = wp_insert_attachment(
            $attachment,
            $results['file'],
            get_the_ID()
        );

        if (!function_exists('wp_generate_attachment_metadata')) {
            include_once(ABSPATH . 'wp-admin/includes/image.php');
        }

        return wp_update_attachment_metadata(
            $attachment,
            wp_generate_attachment_metadata(
                $attachment,
                $results['file']
            )
        );
    }

    /**
     * Move temporarily file to uploads folder
     *
     * @param $parseUrl
     * @param $imageType
     * @param $tempImage
     *
     * @return array
     */
    protected function moveTemporarilyToUploads($parseUrl, $imageType, $tempImage)
    {
        $fileName = str_replace('/', '', $parseUrl['path']);

        if ($imageType === IMAGETYPE_JPEG) {
            $extension = 'jpg';
        } elseif ($imageType === IMAGETYPE_PNG) {
            $extension = 'png';
        }
        $fileName .= '.' . $extension;

        $file = [
            'name' => $fileName,
            'type' => 'image/' . $extension,
            'tmp_name' => $tempImage,
            'error' => 0,
            'size' => filesize($tempImage),
        ];
        $overrides = [
            'test_form' => false,
        ];

        $results = wp_handle_sideload($file, $overrides);

        return $results;
    }
}
